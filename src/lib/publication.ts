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
export type ForecastSummary = {
  id: string;
  claim: string;
  verdict: Verdict;
  target: string;
  outsideComparison?: string;
};
export type CategoryResult = {
  name: string;
  total: number;
  due: number;
  onTime: number;
  realized: number;
  records: ForecastSummary[];
  otherRecords: ForecastSummary[];
};
/** Presentation data is derived from the same eligibility rules as the ledger. */
export function categoryResults(
  records: Prediction[],
  names: string[],
  asOf: string,
  reading: Reading = "reference",
  common = false,
): CategoryResult[] {
  const all = records.map((p) => selectReading(p, reading));
  const population = (common ? commonCohort(records) : records).map((p) =>
    selectReading(p, reading),
  );
  return names
    .map((name) => {
      const rows = population.filter((p) => p.category === name);
      const stats = summarize(rows, asOf);
      const eligible = eligibleRecords(rows, asOf);
      const ids = new Set(eligible.map((p) => p.id));
      function present(p: Prediction): ForecastSummary {
        return {
          id: p.id,
          claim: claim(p),
          verdict: verdict(p, asOf),
          target:
            p.deadline.year === null ? "Undated" : String(p.deadline.year),
        };
      }
      return {
        name,
        total: records.filter((p) => p.category === name).length,
        due: stats.eligible,
        onTime: stats.onTime,
        realized: stats.realized,
        otherRecords: all
          .filter((p) => p.category === name && !ids.has(p.id))
          .map((p) => ({
            ...present(p),
            outsideComparison:
              p.deadline.year === null
                ? "Undated"
                : p.assessment.atDeadline === "NOT_DUE"
                  ? "Future"
                  : "Outside comparison",
          })),
        records: eligible
          .map(present)
          .sort(
            (a, b) =>
              OUTCOME_ORDER.indexOf(
                a.verdict as (typeof OUTCOME_ORDER)[number],
              ) -
                OUTCOME_ORDER.indexOf(
                  b.verdict as (typeof OUTCOME_ORDER)[number],
                ) ||
              Number(a.target) - Number(b.target) ||
              a.id.localeCompare(b.id),
          ),
      };
    })
    .sort((a, b) => b.due - a.due || a.name.localeCompare(b.name));
}
