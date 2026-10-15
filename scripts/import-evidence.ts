import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  evidenceReleaseSchema,
  sourceSchema,
  reconciliationSchema,
  coverageSchema,
} from "../src/lib/evidence-model";
import { adaptEvidence } from "../src/lib/evidence";
import { validateDataset } from "../src/lib/validation";
import { summarize } from "../src/lib/scoring";
import type { Prediction } from "../src/lib/model";

export function importEvidence(
  intake: Prediction[],
  categories: string[],
  asOf: string,
  intakeHash: string,
) {
  const dir = "kurzweil_verification_v0_2";
  const read = (name: string) =>
    JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
  const sha = (bytes: Buffer) =>
    createHash("sha256").update(bytes).digest("hex");
  const manifest = read("MANIFEST.json");
  for (const file of manifest.files) {
    const bytes = fs.readFileSync(path.join(dir, file.name));
    if (bytes.length !== file.bytes || sha(bytes) !== file.sha256)
      throw new Error(`Immutable v0.2 release altered: ${file.name}`);
  }
  const release = evidenceReleaseSchema.parse(
    read("predictions.canonical.v0.2.json"),
  );
  const sourceFile = read("sources.v0.2.json"),
    mappingFile = read("legacy-reconciliation.v0.2.json"),
    coverageFile = read("source-coverage.v0.2.json");
  const sources = sourceSchema.array().parse(sourceFile.sources);
  const mappings = reconciliationSchema.array().parse(mappingFile.mapping);
  const coverage = coverageSchema.array().parse(coverageFile.coverage);
  if (
    [
      release.as_of,
      sourceFile.as_of,
      mappingFile.as_of,
      coverageFile.as_of,
    ].some((date) => date !== asOf)
  )
    throw new Error("Release/snapshot mismatch");
  if (
    release.legacy_input_sha256 !== intakeHash ||
    sha(
      fs.readFileSync(path.join(dir, "kurzweil_prediction_intake_v0_1.csv")),
    ) !== intakeHash
  )
    throw new Error("Original intake hash mismatch");
  const ids = new Set(release.records.map((r) => r.id)),
    sourceIds = new Set(sources.map((s) => s.id));
  if (
    ids.size !== release.records.length ||
    new Set(release.records.map((r) => r.slug)).size !== ids.size ||
    sourceIds.size !== sources.length
  )
    throw new Error("Duplicate release IDs/slugs");
  if (
    mappings.length !== intake.length ||
    new Set(mappings.map((m) => m.legacy_id)).size !== intake.length
  )
    throw new Error("Incomplete original-ID reconciliation");
  for (const m of mappings) {
    const original = intake.find((p) => p.id === m.legacy_id);
    if (
      !original ||
      m.raw_import_sha256 !== intakeHash ||
      original.importedClaim !== m.original_prediction ||
      original.deadline.originalText !== m.original_target_text
    )
      throw new Error(`Original history mismatch: ${m.legacy_id}`);
    if (
      m.canonical_ids.some((id) => !ids.has(id)) ||
      m.source_ids.some((id) => !sourceIds.has(id))
    )
      throw new Error(`Broken reconciliation: ${m.legacy_id}`);
  }
  for (const c of coverage)
    if (c.source_ids.some((id) => !sourceIds.has(id)))
      throw new Error(`Unknown coverage source: ${c.id}`);
  for (const r of release.records) {
    for (const ref of [...r.prediction_sources, ...r.evidence])
      if (!sourceIds.has(ref.source_id))
        throw new Error(`${r.id}: broken source reference`);
    for (const rel of r.legacy_relations)
      if (
        !mappings.some(
          (m) =>
            m.legacy_id === rel.legacy_id && m.canonical_ids.includes(r.id),
        )
      )
        throw new Error(`${r.id}: broken original relation`);
  }
  const file = `${dir}/predictions.canonical.v0.2.json`,
    hash = sha(fs.readFileSync(file));
  const reviewed = validateDataset(
    release.records.map((r) => adaptEvidence(r, sources, file, hash)),
    categories,
    asOf,
  );
  fs.writeFileSync(
    "data/generated/reviewed.json",
    JSON.stringify(reviewed, null, 2) + "\n",
  );
  fs.writeFileSync(
    "public/data/predictions.json",
    JSON.stringify(
      {
        asOf,
        release: release.release_id,
        scope: release.scope,
        reviewDisclosure: release.review_disclosure,
        predictions: reviewed,
      },
      null,
      2,
    ) + "\n",
  );
  fs.writeFileSync(
    "public/data/metrics.json",
    JSON.stringify(
      { asOf, scope: release.scope, ...summarize(reviewed, asOf) },
      null,
      2,
    ) + "\n",
  );
  // Copies are downloads, never edited sources. Manifest hashes remain valid.
  fs.cpSync(dir, "public/data/releases/v0.2", { recursive: true });
  fs.mkdirSync("public/data/releases/v0.1", { recursive: true });
  fs.copyFileSync(
    "data/releases/v0.1/predictions.json",
    "public/data/releases/v0.1/predictions.json",
  );
  fs.copyFileSync(
    "data/releases/v0.1/config.json",
    "public/data/releases/v0.1/config.json",
  );
  console.log(
    `Evidence: ${reviewed.length} curated records; ${mappings.length} original routes retained; ${summarize(reviewed, asOf).eligible} due and eligible.`,
  );
}
