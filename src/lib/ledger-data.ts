import type { Prediction } from "./model";
import type { Reading } from "./evidence-model";
import type { ScoredOutcome } from "./publication";

/**
 * Strip heavy archival blobs (duplicated stringified JSON, full revision
 * history, non-scoring comparators, and raw CSV dumps) before passing records
 * to the interactive /predictions/ client table. All full research history
 * remains intact in /predictions/[id]/, /evidence/[id]/summary.json, and
 * downloadable JSON/CSV archives.
 */
export function toLedgerRecord(p: Prediction): Prediction {
  return {
    id: p.id,
    selectedReading: p.selectedReading,
    familyId: null,
    parentStatementId: null,
    duplicateOf: p.duplicateOf,
    canonical: p.canonical,
    scoringKey: p.scoringKey,
    category: p.category,
    tags: p.tags,
    claimType: p.claimType,
    importedClaim: p.importedClaim,
    originalWording: p.originalWording,
    wordingKind: p.wordingKind,
    normalizedClaim: p.normalizedClaim,
    successCriteria: p.successCriteria,
    scope: {
      population: null,
      geography: null,
      adoptionStage: null,
      conditions: null,
      units: null,
    },
    sources: p.sources.map((s) => ({
      id: s.id,
      title: s.title,
      publicationYear: s.publicationYear,
      publicationYearVerified: s.publicationYearVerified,
      url: s.url,
      locator: null,
      wordingVerified: s.wordingVerified,
    })),
    deadline: p.deadline,
    evidence: p.evidence.map((e) => ({
      id: "",
      title: "",
      url: e.url,
      publishedAt: null,
      accessedAt: "",
      stance: e.stance,
      note: "",
    })),
    assessment: {
      ...p.assessment,
      reviewer: null,
      rationale: null,
      alternativeInterpretation: null,
    },
    research: {
      notes: p.research.notes,
      unresolvedQuestions: [],
      history: [],
    },
    provenance: {
      inputFile: p.provenance.inputFile,
      inputSha256: "",
      row: p.provenance.row,
      legacyId: p.provenance.legacyId,
      raw: {},
    },
    release: p.release
      ? ({
          is_new_in_v03: p.release.is_new_in_v03,
          attribution_confidence: p.release.attribution_confidence,
          outcome_confidence: p.release.outcome_confidence,
          timing_confidence: p.release.timing_confidence,
          source_verification: {
            state: p.release.source_verification.state,
          },
          legacy_relations: p.release.legacy_relations.map((r) => ({
            legacy_id: r.legacy_id,
          })),
          timing: p.release.timing
            ? {
                kind: p.release.timing.kind,
                label: p.release.timing.label,
                drift_years: p.release.timing.drift_years,
              }
            : undefined,
          assessment: {
            verdict: p.release.assessment.verdict,
            at_deadline: p.release.assessment.at_deadline,
            at_review: p.release.assessment.at_review,
            eligible_for_deadline_metrics:
              p.release.assessment.eligible_for_deadline_metrics,
            drift_years: p.release.assessment.drift_years,
            verdict_qualifier: p.release.assessment.verdict_qualifier,
            full_achievement_documented_by_year:
              p.release.assessment.full_achievement_documented_by_year,
            drift_range_years: p.release.assessment.drift_range_years,
          },
          interpretations: p.release.interpretations
            ? Object.fromEntries(
                Object.entries(p.release.interpretations).map(([k, v]) => [
                  k,
                  {
                    criterion: v.criterion,
                    verdict: v.verdict,
                    at_deadline: v.at_deadline,
                    at_review: v.at_review,
                    deadline_year: v.deadline_year,
                    documented_by_year: v.documented_by_year,
                    same_as_reference: v.same_as_reference,
                    eligible_for_deadline_metrics:
                      v.eligible_for_deadline_metrics,
                    evidence_source_ids: v.evidence_source_ids,
                    relaxed_or_changed_conditions:
                      v.relaxed_or_changed_conditions,
                    rationale: "",
                  },
                ]),
              )
            : undefined,
        } as unknown as Prediction["release"])
      : undefined,
    reconciliation: p.reconciliation
      ? ({
          reason: p.reconciliation.reason,
          conditional_outcome: p.reconciliation.conditional_outcome
            ? {
                verdict: p.reconciliation.conditional_outcome.verdict,
                at_deadline: p.reconciliation.conditional_outcome.at_deadline,
                at_review: p.reconciliation.conditional_outcome.at_review,
                component_assessments:
                  p.reconciliation.conditional_outcome.component_assessments.map(
                    (c) => ({
                      at_deadline: c.at_deadline,
                      at_review: c.at_review,
                    }),
                  ),
              }
            : undefined,
        } as unknown as Prediction["reconciliation"])
      : undefined,
  };
}

export type SnapshotCounts = {
  due: number;
  counts: Record<ScoredOutcome, number>;
  onTime: number;
  realized: number;
};

export type TypeSplit = {
  due: number;
  counts: Record<ScoredOutcome, number>;
  onTime: number;
  realized: number;
};

export type CapabilitySplitViews = Record<
  Reading,
  {
    capability: TypeSplit;
    adoption: TypeSplit;
    otherDue: number;
  }
>;

export type UpcomingBet = {
  id: string;
  year: number;
  claim: string;
  category: string;
  progress: "PARTLY_FULFILLED" | "NOT_FULFILLED" | "FULFILLED";
};
