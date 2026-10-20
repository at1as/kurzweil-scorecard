import type { Prediction, Verdict } from "./model";
import type { Reading } from "./evidence-model";
import { commonCohort, selectReading } from "./interpretations";
import { eligibleRecords, summarize, verdict } from "./scoring";
import { claim } from "./model";

export const OUTCOME_ORDER = ["CORRECT", "LATE", "PARTIAL", "MISSED"] as const;
export const OUTCOME_LABELS = {
  CORRECT: "On time",
  LATE: "Late",
  PARTIAL: "Partial",
  MISSED: "Missed",
};
export const OUTCOME_MARKS = {
  CORRECT: "✓",
  LATE: "↗",
  PARTIAL: "◐",
  MISSED: "×",
};
export const PUBLIC_READINGS: Record<Reading, string> = {
  reference: "Our judgment",
  strict: "Stricter / alternative",
  broader: "Broader / directional",
};
export type CategoryResult = {
  name: string;
  total: number;
  due: number;
  onTime: number;
  realized: number;
  records: { id: string; claim: string; verdict: Verdict }[];
};
/** Presentation data is derived from the same eligibility rules as the ledger. */
export function categoryResults(
  records: Prediction[],
  names: string[],
  asOf: string,
  reading: Reading = "reference",
  common = false,
): CategoryResult[] {
  const population = (common ? commonCohort(records) : records).map((p) =>
    selectReading(p, reading),
  );
  return names
    .map((name) => {
      const rows = population.filter((p) => p.category === name);
      const stats = summarize(rows, asOf);
      return {
        name,
        total: records.filter((p) => p.category === name).length,
        due: stats.eligible,
        onTime: stats.onTime,
        realized: stats.realized,
        records: eligibleRecords(rows, asOf)
          .map((p) => ({
            id: p.id,
            claim: claim(p),
            verdict: verdict(p, asOf),
          }))
          .sort(
            (a, b) =>
              OUTCOME_ORDER.indexOf(
                a.verdict as (typeof OUTCOME_ORDER)[number],
              ) -
                OUTCOME_ORDER.indexOf(
                  b.verdict as (typeof OUTCOME_ORDER)[number],
                ) || a.id.localeCompare(b.id),
          ),
      };
    })
    .sort((a, b) => b.due - a.due || a.name.localeCompare(b.name));
}
