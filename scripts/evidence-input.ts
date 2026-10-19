import fs from "node:fs";
import researchRaw from "../data/research/citation-supplement-2026-10-18.json";
import { citationSupplementSchema } from "../src/lib/research-supplement";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  evidenceV03ReleaseSchema,
  sourceSchema,
  reconciliationSchema,
} from "../src/lib/evidence-model";
export const EVIDENCE_DIR = "kurzweil_verification_v0_3_package";
export const evidenceFile = `${EVIDENCE_DIR}/predictions.canonical.v0.3.json`;
export const sha = (file: string) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex");
export function loadEvidence() {
  const read = (file: string) =>
    JSON.parse(fs.readFileSync(path.join(EVIDENCE_DIR, file), "utf8"));
  const manifest = read("MANIFEST.json");
  for (const f of manifest.files)
    if (
      sha(`${EVIDENCE_DIR}/${f.name}`) !== f.sha256 ||
      fs.statSync(`${EVIDENCE_DIR}/${f.name}`).size !== f.bytes
    )
      throw new Error(`Immutable v0.3 release altered: ${f.name}`);
  const release = evidenceV03ReleaseSchema.parse(
    read("predictions.canonical.v0.3.json"),
  );
  const sources = sourceSchema.array().parse(read("sources.v0.3.json").sources);
  const mappings = reconciliationSchema
    .array()
    .parse(read("legacy-reconciliation.v0.3.json").mapping);
  const ids = new Set(release.records.map((r) => r.id)),
    sids = new Set(sources.map((s) => s.id));
  if (
    ids.size !== release.records.length ||
    new Set(release.records.map((r) => r.slug)).size !== ids.size ||
    sids.size !== sources.length
  )
    throw new Error("Duplicate release IDs/slugs/sources");
  for (const r of release.records) {
    const refs = [...r.prediction_sources, ...r.evidence].map(
      (r) => r.source_id,
    );
    refs.push(
      ...Object.values(r.interpretations!).flatMap(
        (v) => v.evidence_source_ids,
      ),
      ...(r.non_scoring_comparators ?? []).flatMap(
        (v) => v.evidence_source_ids ?? [],
      ),
    );
    if (refs.some((id) => !sids.has(id)))
      throw new Error(`${r.id}: unknown evidence source`);
    if (r.assessment.as_of !== release.as_of)
      throw new Error(`${r.id}: inconsistent review date`);
  }
  for (const m of mappings) {
    if (
      m.canonical_ids.some((id) => !ids.has(id)) ||
      [
        ...m.source_ids,
        ...(m.conditional_outcome?.evidence_source_ids ?? []),
      ].some((id) => !sids.has(id))
    )
      throw new Error(`${m.legacy_id}: invalid reconciliation link`);
    if (!m.outcome_disposition_complete || m.as_of !== release.as_of)
      throw new Error(`${m.legacy_id}: incomplete outcome disposition`);
  }
  const supplement = citationSupplementSchema.parse(researchRaw);
  if (supplement.outcome_cutoff !== release.as_of)
    throw new Error("Supplement outcome cutoff mismatch");
  const mergedIds = new Set(sources.map((s) => s.id));
  for (const s of supplement.sources) {
    if (mergedIds.has(s.id))
      throw new Error(`Supplement source collision: ${s.id}`);
    mergedIds.add(s.id);
  }
  const checked = new Set<string>();
  for (const c of supplement.citations) {
    const key = `${c.record_id}:${c.source_id}`;
    if (checked.has(key))
      throw new Error(`Repeated supplement citation: ${key}`);
    checked.add(key);
    const r = release.records.find((r) => r.id === c.record_id);
    if (!r || !mergedIds.has(c.source_id))
      throw new Error(`Invalid supplement reference: ${key}`);
    if (
      !r.evidence.some((e) => e.source_id === c.source_id) &&
      !supplement.sources.some((s) => s.id === c.source_id)
    )
      throw new Error(`Supplement citation is not evidence for ${key}`);
  }
  return {
    release,
    sources: [...sources, ...supplement.sources],
    mappings,
    supplement,
  };
}
