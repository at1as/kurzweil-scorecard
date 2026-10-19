import supplementRaw from "../../data/research/citation-supplement-2026-10-18.json";
import type { CitationSupplement } from "./research-supplement";
import raw from "../../data/generated/predictions.json";
import reviewed from "../../data/generated/reviewed.json";
import spec from "../../data/generated/specification.json";
import config from "../../data/config.json";
import releaseData from "../../kurzweil_verification_v0_3_package/predictions.canonical.v0.3.json";
import sourceData from "../../kurzweil_verification_v0_3_package/sources.v0.3.json";
import mappingData from "../../kurzweil_verification_v0_3_package/legacy-reconciliation.v0.3.json";
import coverageData from "../../kurzweil_verification_v0_3_package/source-coverage.v0.3.json";
import previousMapping from "../../kurzweil_verification_v0_2/legacy-reconciliation.v0.2.json";
import type { Prediction } from "./model";
export const predictions = reviewed as Prediction[];
export const reconciliation = mappingData.mapping;
export const originalIntake: Prediction[] = (raw as Prediction[]).map((p) => {
  const mapping = reconciliation.find((m) => m.legacy_id === p.id)!;
  return {
    ...p,
    reconciliation: mapping as Prediction["reconciliation"],
    research: {
      ...p.research,
      history: [
        ...p.research.history,
        {
          date: "2026-10-14",
          note: `Evidence v0.2: ${previousMapping.mapping.find((m) => m.legacy_id === p.id)?.reason}`,
        },
        {
          date: mappingData.as_of,
          note: `${mapping.action}: ${mapping.reason} Original record retained; no automatic redirect or score inherited.`,
        },
      ],
    },
  };
});
export const allRecords = [...predictions, ...originalIntake];
export const release = {
  id: "0.3",
  scope:
    "Selected source-matched distinct forecast versions; not a lifetime accuracy estimate.",
  disclosure:
    "AI-assisted editorial assessments; original book editions not independently collated. Attribution and outcome confidence are recorded separately.",
};
export const researchSupplement = supplementRaw as CitationSupplement;
export const evidenceSources = [
  ...sourceData.sources,
  ...researchSupplement.sources,
] as import("./evidence-model").EvidenceSource[];
export const evidenceCoverage = coverageData.covered_sources.map((s) => ({
  id: s.source_id,
  source_or_corpus:
    sourceData.sources.find((x) => x.id === s.source_id)?.title ?? s.source_id,
  status: s.state,
  scope_checked: "note" in s ? s.note : "Selected source passages reviewed.",
  remaining_work: coverageData.remaining,
  source_ids: [s.source_id],
}));
export const categories = spec.categories;
export const coverage = spec.coverage;
export const AS_OF = config.asOf;
export const AS_OF_LABEL = new Date(`${AS_OF}T12:00:00Z`).toLocaleDateString(
  "en-US",
  { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" },
);
export const datasetVersion = config.version;
