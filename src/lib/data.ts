import raw from "../../data/generated/predictions.json";
import reviewed from "../../data/generated/reviewed.json";
import spec from "../../data/generated/specification.json";
import config from "../../data/config.json";
import releaseData from "../../kurzweil_verification_v0_2/predictions.canonical.v0.2.json";
import sourceData from "../../kurzweil_verification_v0_2/sources.v0.2.json";
import mappingData from "../../kurzweil_verification_v0_2/legacy-reconciliation.v0.2.json";
import coverageData from "../../kurzweil_verification_v0_2/source-coverage.v0.2.json";
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
          date: mappingData.as_of,
          note: `${mapping.action}: ${mapping.reason} Original record retained; no automatic redirect or score inherited.`,
        },
      ],
    },
  };
});
export const allRecords = [...predictions, ...originalIntake];
export const release = {
  id: releaseData.release_id,
  scope: releaseData.scope,
  disclosure: releaseData.review_disclosure,
};
export const evidenceSources = sourceData.sources;
export const evidenceCoverage = coverageData.coverage;
export const categories = spec.categories;
export const coverage = spec.coverage;
export const AS_OF = config.asOf;
export const AS_OF_LABEL = new Date(`${AS_OF}T12:00:00Z`).toLocaleDateString(
  "en-US",
  { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" },
);
export const datasetVersion = config.version;
