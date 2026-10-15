import fs from "node:fs";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import records from "../data/generated/predictions.json";
import reviewed from "../data/generated/reviewed.json";
import spec from "../data/generated/specification.json";
import config from "../data/config.json";
import releaseRaw from "../kurzweil_verification_v0_2/predictions.canonical.v0.2.json";
import sourcesRaw from "../kurzweil_verification_v0_2/sources.v0.2.json";
import manifest from "../kurzweil_verification_v0_2/MANIFEST.json";
import { evidenceReleaseSchema, sourceSchema } from "../src/lib/evidence-model";
import { adaptEvidence } from "../src/lib/evidence";
import { validateDataset } from "../src/lib/validation";
import { summarize } from "../src/lib/scoring";
const categories = spec.categories.map((c) => c.name);
const sha = (file: string) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex");
for (const f of manifest.files)
  if (sha(`kurzweil_verification_v0_2/${f.name}`) !== f.sha256)
    throw new Error(`Immutable release altered: ${f.name}`);
const release = evidenceReleaseSchema.parse(releaseRaw),
  sources = sourceSchema.array().parse(sourcesRaw.sources);
const inputFile = "kurzweil_verification_v0_2/predictions.canonical.v0.2.json";
const expected = release.records.map((r) =>
  adaptEvidence(r, sources, inputFile, sha(inputFile)),
);
if (!isDeepStrictEqual(expected, reviewed))
  throw new Error("Generated evidence is stale; run npm run data:import");
if (
  release.as_of !== config.asOf ||
  release.legacy_input_sha256 !== sha(config.intakeFile)
)
  throw new Error("Snapshot or intake hash mismatch");
validateDataset(records, categories, config.asOf);
const rows = validateDataset(reviewed, categories, config.asOf);
console.log("Selected subset validated:", summarize(rows, config.asOf));
