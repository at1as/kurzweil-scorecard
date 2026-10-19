import type { Prediction } from "./model";
import type { Reading } from "./evidence-model";
export function readingOf(p: Prediction) {
  return p.release?.interpretations?.[p.selectedReading ?? "reference"];
}
export function selectReading(
  p: Prediction,
  mode: Reading = "reference",
): Prediction {
  const v = p.release?.interpretations?.[mode];
  if (!v) return p;
  return {
    ...p,
    selectedReading: mode,
    successCriteria: v.criterion,
    deadline: {
      ...p.deadline,
      year: v.deadline_year,
      precision: v.deadline_year === null ? "UNCONFIRMED" : "YEAR",
    },
    assessment: {
      ...p.assessment,
      atDeadline:
        v.at_deadline === "FULFILLED"
          ? "FULL"
          : v.at_deadline === "PARTLY_FULFILLED"
            ? "PARTIAL"
            : v.at_deadline === "UNDATED"
              ? "UNASSESSABLE"
              : v.at_deadline,
      atReview:
        v.at_review === "FULFILLED"
          ? "FULL"
          : v.at_review === "PARTLY_FULFILLED"
            ? "PARTIAL"
            : "NOT_FULFILLED",
      rationale: v.rationale,
      exclusionReason: v.eligible_for_deadline_metrics
        ? null
        : v.at_deadline === "NOT_DUE"
          ? "Future deadline; current outcome assessed."
          : "Undated; no deadline-based credit.",
    },
  };
}
export function commonCohort(records: Prediction[]) {
  return records.filter(
    (p) =>
      p.release?.interpretations &&
      Object.values(p.release.interpretations).every(
        (v) => v.eligible_for_deadline_metrics,
      ),
  );
}
export function deadlineOutcome(p: Prediction) {
  return (
    readingOf(p)?.at_deadline ??
    p.release?.assessment.at_deadline ??
    p.reconciliation?.conditional_outcome?.at_deadline ??
    (p.reconciliation?.conditional_outcome?.component_assessments.length
      ? "SEE_COMPONENT_ASSESSMENTS"
      : p.assessment.atDeadline)
  );
}
export function reviewOutcome(p: Prediction) {
  return (
    readingOf(p)?.at_review ??
    p.release?.assessment.at_review ??
    p.reconciliation?.conditional_outcome?.at_review ??
    (p.reconciliation?.conditional_outcome?.component_assessments.length
      ? "SEE_COMPONENT_ASSESSMENTS"
      : p.assessment.atReview)
  );
}
export function displayOutcome(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}
