import { z } from "zod";
const text = z.string().min(1);
const year = z.number().int().min(1800).max(9999).nullable();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const nullable = text.nullable();
const reference = z
  .object({ source_id: text, locator: z.string(), role: text })
  .strict();
export const READINGS = ["reference", "strict", "broader"] as const;
export type Reading = (typeof READINGS)[number];
export const READING_LABELS = {
  reference: "Reference (stated reasonable reading)",
  strict: "Strict / alternative reading",
  broader: "Broader / directional reading",
};
const completedOutcome = z.enum([
  "FULFILLED",
  "PARTLY_FULFILLED",
  "NOT_FULFILLED",
]);
const suppliedVerdict = z.enum([
  "CORRECT",
  "LATE",
  "PARTIAL",
  "WRONG",
  "PENDING",
]);
const interpretation = z
  .object({
    criterion: text,
    at_deadline: z.enum([
      "FULFILLED",
      "PARTLY_FULFILLED",
      "NOT_FULFILLED",
      "NOT_DUE",
      "UNDATED",
    ]),
    at_review: completedOutcome,
    rationale: text,
    relaxed_or_changed_conditions: z.array(text),
    kind: text,
    documented_by_year: year,
    at_deadline_rationale: text.optional(),
    at_review_rationale: text.optional(),
    evidence_source_ids: z.array(text),
    verdict: suppliedVerdict,
    same_as_reference: z.boolean(),
    eligible_for_deadline_metrics: z.boolean(),
    deadline_year: year,
    outcome_assessment_complete: z.literal(true),
  })
  .strict();
const comparator = z
  .object({
    criterion: text,
    at_deadline: text.optional(),
    at_review: text.optional(),
    verdict: text.optional(),
    rationale: text.optional(),
    relaxed_or_changed_conditions: z.array(text).optional(),
    kind: text.optional(),
    documented_by_year: year.optional(),
    same_as_reference: z.boolean().optional(),
    evidence_source_ids: z.array(text).optional(),
    eligible_for_deadline_metrics: z.literal(false),
    eligible_for_author_accuracy: z.literal(false),
    comparator_warning: text.optional(),
    warning: text.optional(),
  })
  .strict();
export const evidenceRecordSchema = z
  .object({
    population_scope: text.optional(),
    attribution_confidence: text.optional(),
    interpretation_confidence: text.optional(),
    outcome_confidence: z
      .object({ at_deadline: text, at_review: text })
      .strict()
      .optional(),
    timing_confidence: text.optional(),
    date_uncertainty_affects_verdict: z.boolean().optional(),
    interpretations: z
      .object({
        reference: interpretation,
        strict: interpretation,
        broader: interpretation,
      })
      .strict()
      .optional(),
    non_scoring_comparators: z.array(comparator).optional(),
    timing: z
      .object({
        first_full_achievement_year: year,
        documented_by_year: year,
        achievement_interval_years: z
          .tuple([z.number(), z.number()])
          .nullable(),
        kind: text,
        label: z.string(),
        drift_years: z.number().nullable(),
        drift_range_years: z.tuple([z.number(), z.number()]).nullable(),
        bound_is_editorial: z.boolean().optional(),
      })
      .strict()
      .optional(),
    deduplication: z
      .object({
        is_canonical: z.literal(true),
        is_repeated_identical_claim: z.literal(false),
        counting_unit: text,
        note: text,
      })
      .strict()
      .optional(),
    revision_history: z
      .array(
        z
          .object({
            from_version: text,
            previous_assessment: z.record(z.string(), z.unknown()),
            change_reason: text,
          })
          .strict(),
      )
      .optional(),
    is_new_in_v03: z.boolean().optional(),
    counting_policy: z
      .object({
        unit: text,
        identical_repetitions_count_once: z.literal(true),
        alternative_interpretations_count_once: z.literal(true),
        legacy_conditional_rows_count: z.literal(false),
      })
      .strict()
      .optional(),
    id: z.string().regex(/^K\d{3}$/),
    slug: text,
    title: text,
    prediction_paraphrase: text,
    wording_kind: z.literal("EDITORIAL_PARAPHRASE"),
    original_quote: z.null(),
    primary_category: text,
    tags: z.array(text),
    subcategory: z.string(),
    claim_type: z.enum([
      "SOCIAL_OUTCOME",
      "RESEARCH_MILESTONE",
      "TREND",
      "SOCIAL_INSTITUTIONAL",
      "CAPABILITY",
      "ADOPTION",
      "PERFORMANCE_COST",
      "SOCIAL_OR_POPULATION_OUTCOME",
    ]),
    family_id: text,
    parent_statement_id: nullable,
    legacy_ids: z.array(text),
    origin: text,
    publication: z
      .object({
        forecast_year: year,
        year_basis: text,
        original_book_edition_checked: z.boolean(),
        forecast_year_status: text,
      })
      .strict(),
    target: z
      .object({
        text,
        deadline_year: year,
        precision: text,
        year_start: year,
        year_end: year,
        interpretation: nullable,
      })
      .strict(),
    source_verification: z
      .object({
        state: text,
        confidence: text,
        book_text_not_independently_collated: z.boolean(),
      })
      .strict(),
    success_criteria: text,
    assessment: z
      .object({
        at_deadline_rationale: text.optional(),
        at_review_rationale: text.optional(),
        verdict_qualifier: nullable.optional(),
        outcome_evidence_basis: text.optional(),
        attribution_is_separate: z.boolean().optional(),
        first_event_date_required_for_verdict: z.boolean().optional(),
        at_review_semantics: text.optional(),
        review_state: z.enum([
          "EDITORIAL_ASSESSMENT_COMPLETE",
          "ASSESSED",
          "SOURCE_CONFIRMED",
          "ATTRIBUTION_UNRESOLVED",
        ]),
        verdict: z.enum([
          "CORRECT",
          "LATE",
          "PARTIAL",
          "WRONG",
          "WRONG_MISSED",
          "PENDING",
          "UNSCORABLE",
          "UNREVIEWED",
        ]),
        as_of: date,
        at_deadline: z.enum([
          "FULFILLED",
          "PARTLY_FULFILLED",
          "UNDATED",
          "NOT_ASSESSED",
          "NOT_DUE",
          "NOT_FULFILLED",
          "PARTIAL",
        ]),
        at_review: z.enum([
          "FULFILLED",
          "PARTLY_FULFILLED",
          "FULFILLED_UNDER_STATED_HARDWARE_PROXY",
          "FULL_FULFILLMENT_NOT_ESTABLISHED",
          "NOT_ASSESSED",
          "NOT_FULFILLED",
        ]),
        confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
        disputed_interpretation: z.boolean(),
        benchmark_ready: z.boolean(),
        rationale: text,
        first_full_achievement_year: year,
        full_achievement_documented_by_year: year,
        drift_years: z.number().nullable(),
        drift_range_years: z.tuple([z.number(), z.number()]).nullable(),
        still_unfulfilled_as_of_review: z.boolean(),
        eligible_for_deadline_metrics: z.boolean(),
        withheld_reason: nullable,
      })
      .strict(),
    prediction_sources: z.array(reference).min(1),
    evidence: z.array(reference),
    limitations: z.string(),
    open_questions: z.array(text),
    legacy_relations: z.array(
      z.object({ legacy_id: text, relation: text }).strict(),
    ),
  })
  .strict();
export type EvidenceRecord = z.infer<typeof evidenceRecordSchema>;
export const evidenceReleaseSchema = z
  .object({
    schema_version: text,
    release_id: text,
    as_of: date,
    title: text,
    review_disclosure: text,
    scope: text,
    legacy_input_sha256: z.string().regex(/^[a-f0-9]{64}$/),
    sources_file: text,
    records: z.array(evidenceRecordSchema),
  })
  .strict();
export const sourceSchema = z
  .object({
    id: text,
    title: text,
    url: z
      .string()
      .url()
      .refine((v) => /^https?:\/\//.test(v)),
    kind: text,
    publication_date: nullable,
    checked_as_of: date,
    access: text.optional(),
    access_method: text.optional(),
    access_note: text.optional(),
    provenance_note: z.string(),
  })
  .strict();
export type EvidenceSource = z.infer<typeof sourceSchema>;
export const reconciliationSchema = z
  .object({
    as_of: date.optional(),
    canonical_version: text.optional(),
    canonical_outcomes: z
      .array(
        z
          .object({
            id: text,
            title: text,
            verdict: suppliedVerdict,
            at_deadline: text,
            at_review: text,
          })
          .strict(),
      )
      .optional(),
    conditional_outcome: z
      .object({
        assessment_basis: text,
        assessed_claim: text.optional(),
        assumed_deadline_year: year.optional(),
        at_deadline: text.optional(),
        at_review: text.optional(),
        verdict: text.optional(),
        rationale: text,
        evidence_source_ids: z.array(text).optional(),
        broader_reading: z.string().nullable().optional(),
        date_note: z.string().nullable().optional(),
        attribution_status: text.optional(),
        outcome_confidence: text.optional(),
        eligible_for_author_accuracy: z.literal(false),
        component_assessments: z.array(
          z
            .object({
              id: text.optional(),
              title: text.optional(),
              claim: text.optional(),
              deadline: z.union([z.string(), z.number()]).nullable().optional(),
              at_deadline: text,
              at_review: text,
              verdict: text.optional(),
              documented_by_year: year.optional(),
              qualifier: nullable.optional(),
            })
            .strict(),
        ),
      })
      .strict()
      .optional(),
    outcome_disposition_complete: z.boolean().optional(),
    original_raw_safe_to_score: z.literal(false).optional(),
    action: text,
    canonical_ids: z.array(text),
    reason: text,
    source_ids: z.array(text),
    automatic_redirect: z.literal(false),
    legacy_id: text,
    raw_import_sha256: text,
    retain_original_record: z.literal(true),
    safe_to_score_original_unchanged: z.literal(false),
    requires_manual_route_decision: z.boolean(),
    original_prediction: text,
    original_target_text: z.string(),
  })
  .strict();
export const coverageSchema = z
  .object({
    id: text,
    source_or_corpus: text,
    status: text,
    source_ids: z.array(text),
    scope_checked: text,
    remaining_work: text,
  })
  .strict();

export const evidenceV03ReleaseSchema = z
  .object({
    schema_version: z.literal("0.3"),
    as_of: date,
    records_count: z.number().int(),
    supersedes: text,
    research_method: text,
    outcome_complete_does_not_mean_attribution_certain: z.literal(true),
    lifetime_exhaustive: z.literal(false),
    original_editions_independently_collated: z.literal(false),
    default_view: z.literal("reference"),
    source_registry: text,
    legacy_map: text,
    metrics_file: text,
    records: z.array(evidenceRecordSchema),
  })
  .strict()
  .superRefine((release, ctx) => {
    for (const r of release.records)
      if (
        !r.interpretations ||
        !r.timing ||
        !r.revision_history ||
        !r.outcome_confidence ||
        r.is_new_in_v03 === undefined ||
        r.assessment.review_state !== "EDITORIAL_ASSESSMENT_COMPLETE"
      )
        ctx.addIssue({
          code: "custom",
          message: `${r.id}: incomplete v0.3 assessment metadata`,
        });
  });
