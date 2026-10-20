import { claim, type Prediction } from "./model";
import { READINGS, type Reading } from "./evidence-model";
import {
  deadlineOutcome,
  reviewOutcome,
  selectReading,
} from "./interpretations";
import { eligibleRecords, verdict } from "./scoring";

/** A compact, read-only view of the existing assessments; no new judgments. */
export function evidenceSummary(p: Prediction, asOf: string) {
  const views = Object.fromEntries(
    READINGS.map((reading) => {
      const selected = selectReading(p, reading);
      const interpretation = p.release?.interpretations?.[reading];
      return [
        reading,
        {
          verdict: verdict(selected, asOf),
          deadline: selected.deadline.year,
          criterion: selected.successCriteria,
          rationale: selected.assessment.rationale,
          atDeadline: deadlineOutcome(selected),
          atReview: reviewOutcome(selected),
          eligible: eligibleRecords([selected], asOf).length > 0,
          changedConditions:
            interpretation?.relaxed_or_changed_conditions ?? [],
          evidence: p.evidence,
        },
      ];
    }),
  ) as Record<
    Reading,
    {
      verdict: ReturnType<typeof verdict>;
      deadline: number | null;
      criterion: string | null;
      rationale: string | null;
      atDeadline: string;
      atReview: string;
      eligible: boolean;
      changedConditions: string[];
      evidence: Prediction["evidence"];
    }
  >;
  return {
    id: p.id,
    claim: claim(p),
    category: p.category,
    asOf,
    originalWording: p.originalWording ?? p.importedClaim,
    wordingKind: p.wordingKind,
    sources: p.sources,
    hasInterpretations: Boolean(p.release?.interpretations),
    sourceCaveat: p.release?.source_verification
      .book_text_not_independently_collated
      ? "The original book edition has not been independently checked. See the listed source and full record for attribution limits."
      : p.wordingKind === "UNVERIFIED_PARAPHRASE"
        ? "This is an imported lead. Its wording and attribution have not been verified."
        : "Claims are shown as paraphrases unless identified as a verified quotation.",
    legacy: p.reconciliation
      ? {
          reason: p.reconciliation.reason,
          canonicalIds: p.reconciliation.canonical_ids,
        }
      : null,
    views,
  };
}
export type EvidenceSummary = ReturnType<typeof evidenceSummary>;
