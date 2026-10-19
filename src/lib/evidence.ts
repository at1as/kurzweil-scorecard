import type { EvidenceRecord, EvidenceSource } from "./evidence-model";
import { readingOf } from "./interpretations";
import type { Prediction } from "./model";

/** Lossless release payload alongside the site's common browsing fields. No new judgments. */
export function adaptEvidence(
  r: EvidenceRecord,
  sources: EvidenceSource[],
  inputFile: string,
  inputSha256: string,
): Prediction {
  const a = r.assessment;
  const source = (id: string) => {
    const found = sources.find((s) => s.id === id);
    if (!found) throw new Error(`${r.id}: unknown source ${id}`);
    return found;
  };
  return {
    id: r.id,
    release: r,
    familyId: r.family_id,
    parentStatementId: r.parent_statement_id,
    duplicateOf: null,
    canonical: true,
    scoringKey: r.id,
    category: r.primary_category,
    tags: [...new Set([...r.tags, r.subcategory].filter(Boolean))],
    claimType: [
      "SOCIAL_OR_POPULATION_OUTCOME",
      "SOCIAL_OUTCOME",
      "SOCIAL_INSTITUTIONAL",
    ].includes(r.claim_type)
      ? "SOCIAL_INSTITUTIONAL"
      : (r.claim_type as Prediction["claimType"]),
    importedClaim: r.prediction_paraphrase,
    originalWording: null,
    wordingKind: "EDITORIAL_PARAPHRASE",
    normalizedClaim: r.prediction_paraphrase,
    successCriteria: r.success_criteria,
    scope: {
      population: null,
      geography: null,
      adoptionStage: null,
      conditions: null,
      units: null,
    },
    sources: r.prediction_sources.map((ref) => {
      const s = source(ref.source_id);
      return {
        id: s.id,
        title: s.title,
        publicationYear: r.publication.forecast_year,
        publicationYearVerified: false,
        url: s.url,
        locator: ref.locator,
        wordingVerified: false,
      };
    }),
    deadline: {
      originalText: r.target.text,
      year: r.target.deadline_year,
      exactDate: null,
      startYear: null,
      precision: r.target.deadline_year === null ? "UNCONFIRMED" : "YEAR",
    },
    evidence: r.evidence.map((ref, i) => {
      const s = source(ref.source_id);
      return {
        sourceId: s.id,
        id: `${s.id}-${i}`,
        title: s.title,
        url: s.url,
        publishedAt: /^\d{4}-\d{2}-\d{2}$/.test(s.publication_date ?? "")
          ? s.publication_date
          : null,
        accessedAt: s.checked_as_of,
        stance: "CONTEXT",
        note: `${ref.locator}. ${s.provenance_note}`,
      };
    }),
    assessment: {
      state: a.review_state,
      scorable: a.benchmark_ready,
      atDeadline:
        a.at_deadline === "FULFILLED"
          ? "FULL"
          : ["UNDATED", "NOT_ASSESSED"].includes(a.at_deadline)
            ? "UNREVIEWED"
            : a.at_deadline === "PARTLY_FULFILLED"
              ? "PARTIAL"
              : (a.at_deadline as Prediction["assessment"]["atDeadline"]),
      atReview: a.at_review.startsWith("FULFILLED")
        ? "FULL"
        : a.at_review === "NOT_FULFILLED"
          ? "NOT_FULFILLED"
          : a.at_review === "PARTLY_FULFILLED"
            ? "PARTIAL"
            : "UNREVIEWED",
      firstAchievementYear: a.first_full_achievement_year,
      firstAchievementDate: null,
      lastReviewedAt: a.as_of,
      reviewer:
        "AI-assisted source review; editorial assessment, not human peer review",
      confidence: a.confidence,
      disputed: a.disputed_interpretation,
      rationale: a.rationale,
      alternativeInterpretation: a.disputed_interpretation
        ? r.limitations
        : null,
      exclusionReason: a.withheld_reason,
    },
    research: {
      notes: r.limitations,
      unresolvedQuestions: r.open_questions,
      history: [
        ...(r.revision_history ?? []).map((h) => ({
          date: String(h.previous_assessment.as_of),
          note: `Evidence v${h.from_version}: ${h.previous_assessment.verdict}. ${h.previous_assessment.rationale} Change: ${h.change_reason}`,
        })),
        {
          date: a.as_of,
          note: `Evidence v${r.interpretations ? "0.3" : "0.2"}: ${a.review_state}; supplied verdict ${a.verdict}. ${a.rationale}`,
        },
      ],
    },
    provenance: {
      inputFile,
      inputSha256,
      row: null,
      legacyId: null,
      raw: { release_record: JSON.stringify(r) },
    },
  };
}

export function validateEvidenceRecord(p: Prediction, asOf: string) {
  const r = p.release!;
  const a = r.assessment;
  const require = (condition: unknown, message: string) => {
    if (!condition) throw new Error(`${p.id}: ${message}`);
  };
  if (r.interpretations) {
    require(r.id === p.id &&
      r.primary_category === p.category, "release identity/category mismatch");
    require(a.as_of === p.assessment.lastReviewedAt &&
      a.as_of <= asOf, "release review date mismatch");
    require(a.review_state === p.assessment.state, "review state mismatch");
    require(p.wordingKind === "EDITORIAL_PARAPHRASE" &&
      p.originalWording === null, "release descriptions are not quotations");
    require(p.assessment.firstAchievementYear ===
      r.timing
        ?.first_full_achievement_year, "evidence bound cannot become first achievement year");
    require(r.timing?.documented_by_year ===
      a.full_achievement_documented_by_year, "timing bound mismatch");
    for (const [mode, v] of Object.entries(r.interpretations)) {
      require(!v.eligible_for_deadline_metrics ||
        (v.deadline_year !== null &&
          `${v.deadline_year}-12-31` < asOf &&
          !["NOT_DUE", "UNDATED"].includes(
            v.at_deadline,
          )), `${mode}: eligible deadline is not due`);
      require(v.verdict !== "LATE" ||
        (v.at_review === "FULFILLED" &&
          v.at_deadline !== "FULFILLED"), `${mode}: late outcome mismatch`);
      require(v.verdict !== "PENDING" ||
        v.at_deadline === "NOT_DUE", `${mode}: pending outcome mismatch`);
      if (mode === "reference")
        for (const key of [
          "verdict",
          "at_deadline",
          "at_review",
          "eligible_for_deadline_metrics",
        ] as const)
          require(v[key] === a[key], "reference/assessment mismatch");
    }
    const v = readingOf(p)!;
    require(p.deadline.year === v.deadline_year, "reading deadline mismatch");
    require(r.timing?.drift_years === null ||
      (r.timing?.first_full_achievement_year !== null &&
        r.target.deadline_year !== null &&
        r.timing!.drift_years ===
          r.timing!.first_full_achievement_year! -
            r.target.deadline_year!), "exact drift needs supported years");
    return;
  }
  require(r.id === p.id &&
    r.primary_category === p.category, "release identity/category mismatch");
  require(a.as_of <= asOf &&
    a.as_of === p.assessment.lastReviewedAt, "release review date mismatch");
  require(a.review_state ===
    p.assessment.state, "release review state mismatch");
  require(p.wordingKind === "EDITORIAL_PARAPHRASE" &&
    p.originalWording === null, "release descriptions are not quotations");
  require(p.assessment.firstAchievementYear ===
    a.first_full_achievement_year, "evidence bound cannot become first achievement year");
  require(p.deadline.year ===
    r.target.deadline_year, "release deadline mismatch");
  require(a.review_state === "ASSESSED" ||
    a.verdict ===
      "UNREVIEWED", "source confirmation is not outcome assessment");
  if (a.eligible_for_deadline_metrics) {
    require(a.review_state === "ASSESSED" &&
      ["CORRECT", "LATE", "PARTIAL", "WRONG_MISSED"].includes(
        a.verdict,
      ), "ineligible review/verdict in deadline metrics");
    require(r.target.deadline_year !== null &&
      `${r.target.deadline_year}-12-31` < asOf, "eligible deadline is not due");
    require(r.evidence.length &&
      r.prediction_sources.length &&
      a.benchmark_ready, "eligible assessment needs evidence and fixed criteria");
    require(!a.drift_range_years, "qualified interval excluded from default statistics");
  } else require(a.withheld_reason, "withheld metrics need an explanation");
  if (a.verdict === "CORRECT")
    require(a.at_deadline ===
      "FULFILLED", "correct verdict contradicts deadline outcome");
  if (a.verdict === "PENDING")
    require(a.at_deadline === "NOT_DUE" &&
      !a.eligible_for_deadline_metrics, "pending forecast cannot enter due metrics");
  if (a.drift_years !== null)
    require(a.first_full_achievement_year !== null &&
      r.target.deadline_year !== null &&
      a.drift_years ===
        a.first_full_achievement_year -
          r.target.deadline_year, "exact drift needs exact supported years");
  if (a.drift_range_years)
    require(a.drift_years === null &&
      a.drift_range_years[0] <=
        a.drift_range_years[1], "invalid interval drift");
}
