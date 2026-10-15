import { z } from "zod";
const text = z.string().min(1);
const year = z.number().int().min(1800).max(9999).nullable();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const nullable = text.nullable();
const reference = z
  .object({ source_id: text, locator: text, role: text })
  .strict();
export const evidenceRecordSchema = z
  .object({
    id: z.string().regex(/^K\d{3}$/),
    slug: text,
    title: text,
    prediction_paraphrase: text,
    wording_kind: z.literal("EDITORIAL_PARAPHRASE"),
    original_quote: z.null(),
    primary_category: text,
    tags: z.array(text),
    subcategory: text,
    claim_type: z.enum([
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
        review_state: z.enum([
          "ASSESSED",
          "SOURCE_CONFIRMED",
          "ATTRIBUTION_UNRESOLVED",
        ]),
        verdict: z.enum([
          "CORRECT",
          "LATE",
          "PARTIAL",
          "WRONG_MISSED",
          "PENDING",
          "UNSCORABLE",
          "UNREVIEWED",
        ]),
        as_of: date,
        at_deadline: z.enum([
          "FULFILLED",
          "NOT_ASSESSED",
          "NOT_DUE",
          "NOT_FULFILLED",
          "PARTIAL",
        ]),
        at_review: z.enum([
          "FULFILLED",
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
    access: text,
    provenance_note: z.string(),
  })
  .strict();
export type EvidenceSource = z.infer<typeof sourceSchema>;
export const reconciliationSchema = z
  .object({
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
