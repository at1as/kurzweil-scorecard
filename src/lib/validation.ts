import { validateEvidenceRecord } from "./evidence";
import { predictionSchema, type Prediction } from "./model";
import { deadlineEnd, deadlineYear, isDue, fullyRealized } from "./scoring";
export function validateDataset(
  input: unknown,
  categories: string[],
  asOf: string,
): Prediction[] {
  const rows = predictionSchema.array().parse(input);
  const ids = new Set<string>();
  const keys = new Set<string>();
  for (const p of rows) {
    const require = (condition: unknown, message: string) => {
      if (!condition) throw new Error(`${p.id}: ${message}`);
    };
    require(!ids.has(p.id), "duplicate record ID");
    ids.add(p.id);
    require(categories.includes(p.category), "unknown primary category");
    require(new Set(p.tags).size === p.tags.length, "repeated tags");
    require(p.deadline.year === null ||
      !p.deadline.exactDate ||
      p.deadline.year ===
        Number(
          p.deadline.exactDate.slice(0, 4),
        ), "exact date and deadline year disagree");
    require(p.deadline.precision !== "UNCONFIRMED" ||
      (p.deadline.year === null &&
        p.deadline.exactDate === null &&
        p.deadline.startYear ===
          null), "unconfirmed deadlines cannot carry confirmed date fields");
    require(p.deadline.precision !== "EXACT_DATE" ||
      p.deadline.exactDate, "exact-date precision needs a date");
    require(!p.deadline.exactDate ||
      p.deadline.precision ===
        "EXACT_DATE", "exact date needs exact-date precision");
    require(!["YEAR", "INTERVAL"].includes(p.deadline.precision) ||
      p.deadline.year !== null, "confirmed endpoint required");
    require(p.deadline.startYear === null ||
      (p.deadline.year !== null &&
        p.deadline.startYear <= p.deadline.year), "invalid target interval");
    require(!p.duplicateOf || !p.canonical, "duplicates cannot be canonical");
    require(!p.duplicateOf ||
      (p.duplicateOf !== p.id &&
        rows.some(
          (r) => r.id === p.duplicateOf && !r.duplicateOf,
        )), "duplicate must point to a retained original");
    if (p.canonical) {
      require(p.scoringKey, "canonical record needs an explicit scoring key");
      require(!keys.has(
        p.scoringKey!,
      ), "two canonical records share a scoring key");
      keys.add(p.scoringKey!);
    }
    if (p.assessment.state === "EXCLUDED" || p.duplicateOf)
      require(p.assessment.exclusionReason, "exclusion needs a reason");
    if (p.assessment.disputed)
      require(p.assessment
        .alternativeInterpretation, "disputes need an alternative interpretation");
    if (p.assessment.firstAchievementYear !== null) {
      require(fullyRealized(p), "unmet claims cannot have achievement dates");
      require(p.assessment.firstAchievementYear <=
        Number(
          (p.assessment.lastReviewedAt ?? asOf).slice(0, 4),
        ), "achievement is after the review");
    }
    if (p.assessment.firstAchievementDate) {
      require(p.assessment.firstAchievementYear ===
        Number(
          p.assessment.firstAchievementDate.slice(0, 4),
        ), "achievement year and date disagree");
      require(p.assessment.firstAchievementDate <=
        (p.assessment.lastReviewedAt ??
          asOf), "achievement date is after the review");
    }
    require(![
      "ASSESSED",
      "SOURCE_CONFIRMED",
      "ATTRIBUTION_UNRESOLVED",
    ].includes(p.assessment.state) ||
      p.release, "evidence review state needs an authoritative release record");
    if (p.release) validateEvidenceRecord(p, asOf);
    if (p.assessment.state === "VERIFIED") {
      require(p.assessment.lastReviewedAt &&
        p.assessment.lastReviewedAt <=
          asOf, "verified assessment needs a review date on/before the snapshot");
      require(p.assessment.reviewer &&
        p.assessment.rationale &&
        p.assessment
          .confidence, "verified assessment needs a reviewer, rationale, and confidence");
      require(p.originalWording &&
        p.wordingKind !== "UNVERIFIED_PARAPHRASE" &&
        p.sources.some(
          (s) => s.wordingVerified && s.locator && s.url,
        ), "verified source wording, URL, and locator required");
      require(p.assessment.scorable !== null, "make scorability explicit");
      if (p.assessment.scorable) {
        require(p.successCriteria &&
          p.normalizedClaim &&
          deadlineEnd(
            p,
          ), "scorable claims need fixed criteria, normalized wording, and a confirmed deadline");
        require(p.evidence.length &&
          p.assessment.atReview !== "UNREVIEWED" &&
          p.assessment.atReview !==
            "UNASSESSABLE", "verified scorable claims need assessed outcomes and evidence");
        require(isDue(p, asOf)
          ? ["FULL", "PARTIAL", "NOT_FULFILLED"].includes(
              p.assessment.atDeadline,
            )
          : p.assessment.atDeadline ===
              "NOT_DUE", "deadline outcome must match the snapshot date");
        require(!isDue(p, asOf) ||
          p.assessment.lastReviewedAt! >
            deadlineEnd(
              p,
            )!, "due claim needs an assessment after its deadline");
      } else
        require(p.assessment.atReview ===
          "UNASSESSABLE", "unscorable claims need an unassessable outcome and explanation");
      const target = deadlineYear(p);
      const actual = p.assessment.firstAchievementYear;
      if (target !== null && actual !== null) {
        require(p.assessment.atDeadline !== "FULL" ||
          actual <= target, "on-time outcome contradicts achievement year");
        require(p.assessment.atDeadline === "FULL" ||
          !isDue(p, asOf) ||
          p.assessment.atReview !== "FULL" ||
          (p.deadline.precision === "EXACT_DATE"
            ? actual >= target
            : actual > target), "late outcome contradicts achievement year");
      }
      if (
        p.deadline.exactDate &&
        p.assessment.firstAchievementDate &&
        isDue(p, asOf)
      )
        require(p.assessment.firstAchievementDate <= p.deadline.exactDate ===
          (p.assessment.atDeadline ===
            "FULL"), "exact achievement and deadline outcomes disagree");
    }
  }
  return rows;
}
