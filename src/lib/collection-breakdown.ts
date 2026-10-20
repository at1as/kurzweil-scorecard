import type { Prediction } from "./model";
import { TYPE_LABELS } from "./model";
import type { Reading } from "./evidence-model";
import { selectReading } from "./interpretations";
import { futureCandidate, publicationDecade, targetDecade } from "./filters";
import { summarize } from "./scoring";
import { OUTCOME_ORDER, type ScoredOutcome } from "./publication";

export const BREAKDOWN_GROUPS = {
  type: "Prediction type",
  target: "Target decade",
  publication: "Publication decade",
  category: "Field",
} as const;
export type BreakdownGroup = keyof typeof BREAKDOWN_GROUPS;

/** Use the same reading, eligibility and group keys as the ledger links. */
export function collectionBreakdown(
  records: Prediction[],
  asOf: string,
  reading: Reading,
  group: BreakdownGroup,
  categoryNames: string[],
) {
  const selected = records.map((p) => selectReading(p, reading));
  function counts(rows: Prediction[]) {
    const stats = summarize(rows, asOf);
    return {
      total: rows.length,
      due: stats.eligible,
      outcomes: Object.fromEntries(
        OUTCOME_ORDER.map((v) => [v, stats.eligibleBreakdown[v]]),
      ) as Record<ScoredOutcome, number>,
      future: rows.filter((p) => futureCandidate(p, asOf)).length,
      undated: rows.filter((p) => p.deadline.year === null).length,
    };
  }
  const buckets = new Map<string, Prediction[]>();
  if (group === "category")
    for (const name of categoryNames) buckets.set(name, []);
  for (const record of selected) {
    const key =
      group === "type"
        ? record.claimType
        : group === "target"
          ? targetDecade(record)
          : group === "publication"
            ? publicationDecade(record)
            : record.category;
    const bucket = buckets.get(key) ?? [];
    bucket.push(record);
    buckets.set(key, bucket);
  }
  return {
    summary: counts(selected),
    groups: [...buckets]
      .map(([key, rows]) => ({
        key,
        label:
          group === "type" ? TYPE_LABELS[key as Prediction["claimType"]] : key,
        ...counts(rows),
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}
