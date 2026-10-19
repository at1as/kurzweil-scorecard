import fs from "node:fs";
import { applyCitationSupplement } from "../src/lib/research-supplement";
import { isDeepStrictEqual } from "node:util";
import { adaptEvidence } from "../src/lib/evidence";
import { validateDataset } from "../src/lib/validation";
import { summarize } from "../src/lib/scoring";
import { commonCohort, selectReading } from "../src/lib/interpretations";
import { READINGS } from "../src/lib/evidence-model";
import {
  EVIDENCE_DIR,
  evidenceFile,
  loadEvidence,
  sha,
} from "./evidence-input";
import type { Prediction } from "../src/lib/model";
export function importEvidence(
  intake: Prediction[],
  categories: string[],
  asOf: string,
  intakeHash: string,
) {
  const { release, sources, mappings, supplement } = loadEvidence();
  if (release.as_of !== asOf) throw new Error("Snapshot mismatch");
  if (
    mappings.length !== intake.length ||
    new Set(mappings.map((m) => m.legacy_id)).size !== intake.length
  )
    throw new Error("Incomplete intake mapping");
  for (const m of mappings) {
    const original = intake.find((p) => p.id === m.legacy_id);
    if (
      !original ||
      m.raw_import_sha256 !== intakeHash ||
      m.original_prediction !== original.importedClaim ||
      m.original_target_text !== original.deadline.originalText
    )
      throw new Error(`${m.legacy_id}: altered original intake`);
  }
  const previous = JSON.parse(
    fs.readFileSync(
      "kurzweil_verification_v0_2/predictions.canonical.v0.2.json",
      "utf8",
    ),
  ).records;
  for (const p of previous) {
    const r = release.records.find((r) => r.id === p.id);
    if (
      !r?.revision_history?.some((h) =>
        isDeepStrictEqual(h.previous_assessment, p.assessment),
      )
    )
      throw new Error(`${p.id}: missing v0.2 assessment history`);
  }
  const records = validateDataset(
    release.records.map((r) =>
      applyCitationSupplement(
        adaptEvidence(r, sources, evidenceFile, sha(evidenceFile)),
        supplement,
      ),
    ),
    categories,
    asOf,
  );
  fs.writeFileSync(
    "data/generated/reviewed.json",
    JSON.stringify(records, null, 2) + "\n",
  );
  fs.writeFileSync(
    "public/data/predictions.json",
    JSON.stringify(
      {
        asOf,
        release: "0.3",
        researchSupplement: {
          id: supplement.id,
          checkedAt: supplement.checked_at,
          outcomeCutoff: supplement.outcome_cutoff,
        },
        scope:
          "Selected source-matched forecast versions; not lifetime accuracy.",
        predictions: records,
      },
      null,
      2,
    ) + "\n",
  );
  fs.writeFileSync(
    "public/data/metrics.json",
    JSON.stringify(
      {
        asOf,
        scope:
          "Selected distinct forecast versions; conditional legacy outcomes and comparators excluded.",
        views: Object.fromEntries(
          READINGS.map((mode) => [
            mode,
            summarize(
              records.map((p) => selectReading(p, mode)),
              asOf,
            ),
          ]),
        ),
        commonCohort: Object.fromEntries(
          READINGS.map((mode) => [
            mode,
            summarize(
              commonCohort(records).map((p) => selectReading(p, mode)),
              asOf,
            ),
          ]),
        ),
      },
      null,
      2,
    ) + "\n",
  );
  fs.mkdirSync("public/data/research", { recursive: true });
  fs.copyFileSync(
    "data/research/citation-supplement-2026-10-18.json",
    "public/data/research/citation-supplement-2026-10-18.json",
  );
  fs.cpSync(EVIDENCE_DIR, "public/data/releases/v0.3", { recursive: true });
  fs.cpSync("data/releases/v0.2", "public/data/releases/v0.2/site-snapshot", {
    recursive: true,
  });
  console.log(
    `Evidence v0.3: ${records.length} canonical versions; ${mappings.length} original routes retained; ${summarize(records, asOf).eligible} reference-eligible.`,
  );
}
