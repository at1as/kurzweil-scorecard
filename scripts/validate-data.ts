import fs from "node:fs";
import { applyCitationSupplement } from "../src/lib/research-supplement";
import { isDeepStrictEqual } from "node:util";
import records from "../data/generated/predictions.json";
import reviewed from "../data/generated/reviewed.json";
import spec from "../data/generated/specification.json";
import config from "../data/config.json";
import { loadEvidence, evidenceFile, sha } from "./evidence-input";
import { adaptEvidence } from "../src/lib/evidence";
import { validateDataset } from "../src/lib/validation";
import { summarize } from "../src/lib/scoring";
const { release, sources, mappings, supplement } = loadEvidence();
const expected = release.records.map((r) =>
  applyCitationSupplement(
    adaptEvidence(r, sources, evidenceFile, sha(evidenceFile)),
    supplement,
  ),
);
if (!isDeepStrictEqual(expected, reviewed))
  throw new Error("Generated evidence is stale; run npm run data:import");
if (
  release.as_of !== config.asOf ||
  mappings.some((m) => m.raw_import_sha256 !== sha(config.intakeFile))
)
  throw new Error("Snapshot/intake hash mismatch");
const categories = spec.categories.map((c) => c.name);
validateDataset(records, categories, config.asOf);
const rows = validateDataset(reviewed, categories, config.asOf);
const s = summarize(rows, config.asOf);
console.log(
  `Validated ${s.collected} canonical versions; ${s.eligible} eligible; ${s.onTime} on time; ${s.realized} fully realized by review.`,
);
