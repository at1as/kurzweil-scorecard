import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";
import { overrideSchema, type Prediction } from "../src/lib/model";
import { validateDataset } from "../src/lib/validation";
const root = process.cwd();
const read = (name: string) =>
  JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
const config = read("data/config.json");
const spec = read("data/generated/specification.json");
const buffer = fs.readFileSync(path.join(root, config.intakeFile));
const hash = createHash("sha256").update(buffer).digest("hex");
const input = parse(buffer, {
  bom: true,
  columns: true,
  skip_empty_lines: true,
}) as Record<string, string>[];
if (input.length !== config.expectedIntakeRows)
  throw new Error(
    `Expected ${config.expectedIntakeRows} original intake rows, found ${input.length}`,
  );
const rows: Prediction[] = input.map((r, index) => {
  if (r["Review state"] !== "UNREVIEWED")
    throw new Error(
      "Original intake must remain unchanged; review through curated files.",
    );
  return {
    id: r["Record ID"],
    familyId: null,
    parentStatementId: r["Parent statement ID"] || null,
    duplicateOf: null,
    canonical: false,
    scoringKey: null,
    category: r["Primary category — draft"],
    tags: r["Subcategory / secondary tags"]
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean),
    claimType: "UNKNOWN",
    importedClaim: r["Prediction — imported lead"],
    originalWording: null,
    wordingKind: "UNVERIFIED_PARAPHRASE",
    normalizedClaim: null,
    successCriteria: null,
    scope: {
      population: null,
      geography: null,
      adoptionStage: null,
      conditions: null,
      units: null,
    },
    sources: [
      {
        id: `${r["Record ID"]}-source`,
        title: r["Claimed source — legacy"],
        publicationYear: r["Source year — unconfirmed"]
          ? Number(r["Source year — unconfirmed"])
          : null,
        publicationYearVerified: false,
        url: null,
        locator: null,
        wordingVerified: false,
      },
    ],
    deadline: {
      originalText: r["Target text — legacy"],
      year: null,
      exactDate: null,
      startYear: null,
      precision: "UNCONFIRMED",
    },
    evidence: [],
    assessment: {
      state: "UNREVIEWED",
      scorable: null,
      atDeadline: "UNREVIEWED",
      atReview: "UNREVIEWED",
      firstAchievementYear: null,
      firstAchievementDate: null,
      lastReviewedAt: null,
      reviewer: null,
      confidence: null,
      disputed: false,
      rationale: null,
      alternativeInterpretation: null,
      exclusionReason: null,
    },
    research: {
      notes: r["Review notes"],
      unresolvedQuestions: [
        "Check the original wording, attribution, and publication date.",
        "Establish the deadline and full success criteria.",
        "Resolve repetitions and related forecast versions.",
        "Find independent evidence for the deadline and review outcomes.",
      ],
      history: [],
    },
    provenance: {
      inputFile: config.intakeFile,
      inputSha256: hash,
      row: index + 2,
      legacyId: r["Legacy import ID"] || null,
      raw: r,
    },
  };
});
const overrides = overrideSchema
  .array()
  .parse(read("data/curated/overrides.json"));
const updated = new Set<string>();
for (const update of overrides) {
  if (updated.has(update.id)) throw new Error(`Repeated override ${update.id}`);
  const index = rows.findIndex((p) => p.id === update.id);
  if (index < 0) throw new Error(`Unknown override ${update.id}`);
  rows[index] = { ...rows[index], ...update.changes };
  updated.add(update.id);
}
rows.push(...read("data/curated/predictions.json"));
const predictions = validateDataset(
  rows,
  spec.categories.map((c: { name: string }) => c.name),
  config.asOf,
);
fs.mkdirSync(path.join(root, "data/generated"), { recursive: true });
fs.writeFileSync(
  path.join(root, "data/generated/predictions.json"),
  JSON.stringify(predictions, null, 2) + "\n",
);
fs.mkdirSync(path.join(root, "public/data"), { recursive: true });
fs.copyFileSync(
  path.join(root, config.intakeFile),
  path.join(root, "public/data/intake.csv"),
);
fs.writeFileSync(
  path.join(root, "public/data/predictions.json"),
  JSON.stringify({ asOf: config.asOf, predictions }, null, 2) + "\n",
);
console.log(
  `Imported ${input.length} leads; ${overrides.length} curated updates; ${predictions.length} total records. Original SHA-256 ${hash}`,
);
