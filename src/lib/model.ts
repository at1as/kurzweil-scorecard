import { z } from "zod";

export const VERDICTS = [
  "CORRECT",
  "LATE",
  "PARTIAL",
  "MISSED",
  "PENDING",
  "UNSCORABLE",
  "UNREVIEWED",
  "EXCLUDED",
] as const;
export type Verdict = (typeof VERDICTS)[number];
export const REVIEW_STATES = [
  "UNREVIEWED",
  "ATTRIBUTION_CHECKED",
  "EVIDENCE_CHECKED",
  "VERIFIED",
  "EXCLUDED",
] as const;
export const CLAIM_TYPES = [
  "UNKNOWN",
  "CAPABILITY",
  "ADOPTION",
  "PERFORMANCE_COST",
  "SOCIAL_INSTITUTIONAL",
] as const;
const year = z.number().int().min(1800).max(9999);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Invalid calendar date",
  );
const nullableText = z.string().min(1).nullable();
const webUrl = z
  .string()
  .url()
  .refine((v) => /^https?:\/\//.test(v), "Use an http(s) source URL");
const outcome = z.enum([
  "FULL",
  "PARTIAL",
  "NOT_FULFILLED",
  "UNASSESSABLE",
  "UNREVIEWED",
]);
export const predictionSchema = z
  .object({
    id: z.string().regex(/^[A-Z0-9][A-Z0-9-]*$/),
    familyId: nullableText,
    parentStatementId: nullableText,
    duplicateOf: nullableText,
    canonical: z.boolean(),
    scoringKey: nullableText,
    category: z.string().min(1),
    tags: z.array(z.string().min(1)),
    claimType: z.enum(CLAIM_TYPES),
    importedClaim: z.string().min(1),
    originalWording: nullableText,
    wordingKind: z.enum([
      "UNVERIFIED_PARAPHRASE",
      "VERIFIED_QUOTE",
      "VERIFIED_PARAPHRASE",
    ]),
    normalizedClaim: nullableText,
    successCriteria: nullableText,
    scope: z.object({
      population: nullableText,
      geography: nullableText,
      adoptionStage: nullableText,
      conditions: nullableText,
      units: nullableText,
    }),
    sources: z
      .array(
        z.object({
          id: z.string(),
          title: z.string().min(1),
          publicationYear: year.nullable(),
          publicationYearVerified: z.boolean(),
          url: webUrl.nullable(),
          locator: nullableText,
          wordingVerified: z.boolean(),
        }),
      )
      .min(1),
    deadline: z.object({
      originalText: z.string(),
      year: year.nullable(),
      exactDate: date.nullable(),
      startYear: year.nullable(),
      precision: z.enum(["UNCONFIRMED", "YEAR", "INTERVAL", "EXACT_DATE"]),
    }),
    evidence: z.array(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        url: webUrl,
        publishedAt: date.nullable(),
        accessedAt: date,
        stance: z.enum(["SUPPORTS", "CHALLENGES", "CONTEXT"]),
        note: z.string().min(1),
      }),
    ),
    assessment: z.object({
      state: z.enum(REVIEW_STATES),
      scorable: z.boolean().nullable(),
      atDeadline: z.enum([
        "FULL",
        "PARTIAL",
        "NOT_FULFILLED",
        "NOT_DUE",
        "UNASSESSABLE",
        "UNREVIEWED",
      ]),
      atReview: outcome,
      firstAchievementYear: year.nullable(),
      firstAchievementDate: date.nullable(),
      lastReviewedAt: date.nullable(),
      reviewer: nullableText,
      confidence: z.enum(["LOW", "MEDIUM", "HIGH"]).nullable(),
      disputed: z.boolean(),
      rationale: nullableText,
      alternativeInterpretation: nullableText,
      exclusionReason: nullableText,
    }),
    research: z.object({
      notes: z.string(),
      unresolvedQuestions: z.array(z.string()),
      history: z.array(z.object({ date, note: z.string().min(1) })),
    }),
    provenance: z.object({
      inputFile: z.string(),
      inputSha256: z.string(),
      row: z.number().int().positive().nullable(),
      legacyId: nullableText,
      raw: z.record(z.string(), z.string()),
    }),
  })
  .strict();
export type Prediction = z.infer<typeof predictionSchema>;
export const overrideSchema = z
  .object({
    id: z.string(),
    changes: predictionSchema
      .omit({ id: true, provenance: true, importedClaim: true })
      .partial()
      .strict(),
  })
  .strict();
export const LABELS: Record<Verdict, string> = {
  CORRECT: "Correct",
  LATE: "Late",
  PARTIAL: "Partial",
  MISSED: "Wrong / missed",
  PENDING: "Pending",
  UNSCORABLE: "Unscorable",
  UNREVIEWED: "Unreviewed",
  EXCLUDED: "Excluded",
};
export const TYPE_LABELS: Record<Prediction["claimType"], string> = {
  UNKNOWN: "Not classified",
  CAPABILITY: "Capability",
  ADOPTION: "Adoption",
  PERFORMANCE_COST: "Performance / cost",
  SOCIAL_INSTITUTIONAL: "Social / institutional",
};
export function claim(p: Prediction) {
  return p.normalizedClaim ?? p.importedClaim;
}
