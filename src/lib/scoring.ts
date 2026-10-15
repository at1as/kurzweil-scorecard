import { type Prediction, type Verdict, VERDICTS } from "./model";

/** A deadline closes after its last calendar day, not on January 1 of its year. */
export function deadlineEnd(p: Prediction): string | null {
  if (p.deadline.precision === "UNCONFIRMED") return null;
  return (
    p.deadline.exactDate ??
    (p.deadline.year === null ? null : `${p.deadline.year}-12-31`)
  );
}
export function isDue(p: Prediction, asOf: string) {
  const end = deadlineEnd(p);
  return end !== null && end < asOf;
}
export function deadlineYear(p: Prediction) {
  return p.deadline.exactDate
    ? Number(p.deadline.exactDate.slice(0, 4))
    : p.deadline.year;
}
export function isVerified(p: Prediction, asOf: string) {
  return (
    p.assessment.state === "VERIFIED" &&
    p.assessment.lastReviewedAt !== null &&
    p.assessment.lastReviewedAt <= asOf
  );
}
export function fullyRealized(p: Prediction) {
  return p.assessment.atDeadline === "FULL" || p.assessment.atReview === "FULL";
}
export function verdict(p: Prediction, asOf: string): Verdict {
  if (p.assessment.state === "EXCLUDED" || p.duplicateOf) return "EXCLUDED";
  if (!isVerified(p, asOf)) return "UNREVIEWED";
  if (!p.assessment.scorable || !deadlineEnd(p)) return "UNSCORABLE";
  if (p.assessment.atDeadline === "FULL") return "CORRECT";
  if (p.assessment.atReview === "FULL")
    return isDue(p, asOf) ? "LATE" : "CORRECT";
  if (!isDue(p, asOf)) return "PENDING";
  if (p.assessment.atReview === "PARTIAL") return "PARTIAL";
  return "MISSED";
}
export function canonicalRecords(records: Prediction[]) {
  const seen = new Set<string>();
  return records.filter((p) => {
    if (
      !p.canonical ||
      !p.scoringKey ||
      p.duplicateOf ||
      p.assessment.state === "EXCLUDED" ||
      seen.has(p.scoringKey)
    )
      return false;
    seen.add(p.scoringKey);
    return true;
  });
}
export function eligibleRecords(records: Prediction[], asOf: string) {
  return canonicalRecords(
    records.filter(
      (p) => isVerified(p, asOf) && p.assessment.scorable && isDue(p, asOf),
    ),
  );
}
export function driftYears(p: Prediction, asOf: string): number | null {
  const target = deadlineYear(p);
  if (
    !isVerified(p, asOf) ||
    !p.assessment.scorable ||
    !fullyRealized(p) ||
    target === null ||
    p.assessment.firstAchievementYear === null
  )
    return null;
  return p.assessment.firstAchievementYear - target;
}
export function forecastHorizon(p: Prediction): number | null {
  const source = p.sources.find(
    (s) => s.publicationYearVerified && s.publicationYear !== null,
  );
  const target = deadlineYear(p);
  return source?.publicationYear != null && target !== null
    ? target - source.publicationYear
    : null;
}
export function summarize(records: Prediction[], asOf: string) {
  const verified = canonicalRecords(records.filter((p) => isVerified(p, asOf)));
  const scored = verified.filter(
    (p) => p.assessment.scorable && deadlineEnd(p),
  );
  const eligible = eligibleRecords(records, asOf);
  const onTime = eligible.filter((p) => p.assessment.atDeadline === "FULL");
  const realized = eligible.filter(fullyRealized);
  const breakdown = Object.fromEntries(
    VERDICTS.map((v) => [
      v,
      verified.filter((p) => verdict(p, asOf) === v).length,
    ]),
  ) as Record<Verdict, number>;
  const drifts = scored
    .map((p) => ({ id: p.id, years: driftYears(p, asOf) }))
    .filter((d): d is { id: string; years: number } => d.years !== null);
  return {
    collected: records.length,
    canonical: canonicalRecords(records).length,
    verified: verified.length,
    scored: scored.length,
    eligible: eligible.length,
    eligibleIds: eligible.map((p) => p.id),
    onTime: onTime.length,
    realized: realized.length,
    onTimeRate: eligible.length ? onTime.length / eligible.length : null,
    realizationRate: eligible.length ? realized.length / eligible.length : null,
    breakdown,
    drifts,
    meanDrift: drifts.length
      ? drifts.reduce((sum, d) => sum + d.years, 0) / drifts.length
      : null,
    unreviewed: records.filter((p) => verdict(p, asOf) === "UNREVIEWED").length,
    excluded: records.filter((p) => verdict(p, asOf) === "EXCLUDED").length,
    disputed: verified.filter((p) => p.assessment.disputed).length,
  };
}
export function rate(value: number | null) {
  return value === null ? "Not yet available" : `${Math.round(value * 100)}%`;
}
export function driftLabel(value: number | null) {
  return value === null ? "—" : `${value > 0 ? "+" : ""}${value}y`;
}
