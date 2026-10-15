import type { Prediction } from "../src/lib/model";
// Synthetic test records only; never imported into the published dataset.
export const AS_OF = "2026-10-13";
export function fixture(id = "TEST-1"): Prediction {
  return {
    id,
    familyId: "TEST-FAMILY",
    parentStatementId: null,
    duplicateOf: null,
    canonical: true,
    scoringKey: id,
    category: "AI & software",
    tags: ["Reasoning"],
    claimType: "CAPABILITY",
    importedClaim: "Synthetic test claim",
    originalWording: "Synthetic full claim by 2009",
    wordingKind: "VERIFIED_QUOTE",
    normalizedClaim: "Synthetic criterion",
    successCriteria: "Meet the entire synthetic criterion",
    scope: {
      population: null,
      geography: null,
      adoptionStage: null,
      conditions: null,
      units: null,
    },
    sources: [
      {
        id: "test-source",
        title: "Synthetic test source",
        publicationYear: 1999,
        publicationYearVerified: true,
        url: "https://example.org/source",
        locator: "p. 1",
        wordingVerified: true,
      },
    ],
    deadline: {
      originalText: "by 2009",
      year: 2009,
      exactDate: null,
      startYear: null,
      precision: "YEAR",
    },
    evidence: [
      {
        id: "test-evidence",
        title: "Synthetic test evidence",
        url: "https://example.org/evidence",
        publishedAt: "2010-01-01",
        accessedAt: AS_OF,
        stance: "SUPPORTS",
        note: "Synthetic outcome evidence",
      },
    ],
    assessment: {
      state: "VERIFIED",
      scorable: true,
      atDeadline: "FULL",
      atReview: "FULL",
      firstAchievementYear: 2009,
      firstAchievementDate: null,
      lastReviewedAt: AS_OF,
      reviewer: "Test fixture",
      confidence: "HIGH",
      disputed: false,
      rationale: "Synthetic assessment",
      alternativeInterpretation: null,
      exclusionReason: null,
    },
    research: {
      notes: "Test-only fixture",
      unresolvedQuestions: [],
      history: [],
    },
    provenance: {
      inputFile: "test fixture",
      inputSha256: "",
      row: null,
      legacyId: null,
      raw: {},
    },
  };
}
export function intake(id = "TEST-INTAKE") {
  const p = fixture(id);
  p.canonical = false;
  p.scoringKey = null;
  p.originalWording = null;
  p.wordingKind = "UNVERIFIED_PARAPHRASE";
  p.normalizedClaim = null;
  p.successCriteria = null;
  p.sources[0].publicationYearVerified = false;
  p.sources[0].wordingVerified = false;
  p.sources[0].url = null;
  p.sources[0].locator = null;
  p.deadline = { ...p.deadline, precision: "UNCONFIRMED", year: null };
  p.assessment = {
    ...p.assessment,
    state: "UNREVIEWED",
    scorable: null,
    atDeadline: "UNREVIEWED",
    atReview: "UNREVIEWED",
    firstAchievementYear: null,
    lastReviewedAt: null,
    reviewer: null,
    confidence: null,
    rationale: null,
  };
  p.evidence = [];
  return p;
}
