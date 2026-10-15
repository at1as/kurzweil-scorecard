import { describe, expect, it } from "vitest";
import {
  canonicalRecords,
  driftYears,
  eligibleRecords,
  forecastHorizon,
  isDue,
  summarize,
  verdict,
} from "../src/lib/scoring";
import { fixture, intake, AS_OF } from "./fixtures";
describe("verdict and dates", () => {
  it("never promotes an unreviewed lead based on its historical date", () => {
    const p = intake();
    expect(verdict(p, AS_OF)).toBe("UNREVIEWED");
    expect(isDue(p, AS_OF)).toBe(false);
    expect(driftYears(p, AS_OF)).toBeNull();
  });
  it("distinguishes full-on-time, eventual-late, partial, and still missed", () => {
    const p = fixture();
    expect(verdict(p, AS_OF)).toBe("CORRECT");
    p.assessment.atDeadline = "NOT_FULFILLED";
    p.assessment.firstAchievementYear = 2015;
    expect(verdict(p, AS_OF)).toBe("LATE");
    expect(driftYears(p, AS_OF)).toBe(6);
    p.assessment.atReview = "PARTIAL";
    p.assessment.firstAchievementYear = null;
    expect(verdict(p, AS_OF)).toBe("PARTIAL");
    expect(driftYears(p, AS_OF)).toBeNull();
    p.assessment.atReview = "NOT_FULFILLED";
    expect(verdict(p, AS_OF)).toBe("MISSED");
  });
  it("keeps a whole-year deadline open through its last day", () => {
    const p = fixture();
    p.deadline.year = 2026;
    expect(isDue(p, "2026-01-01")).toBe(false);
    expect(isDue(p, "2026-12-31")).toBe(false);
    expect(isDue(p, "2027-01-01")).toBe(true);
  });
  it("closes exact deadlines after the deadline day", () => {
    const p = fixture();
    p.deadline = {
      ...p.deadline,
      year: 2026,
      precision: "EXACT_DATE",
      exactDate: "2026-10-12",
    };
    expect(isDue(p, "2026-10-12")).toBe(false);
    expect(isDue(p, "2026-10-13")).toBe(true);
  });
  it("keeps future partial progress pending", () => {
    const p = fixture();
    p.deadline.year = 2030;
    p.assessment.atDeadline = "NOT_DUE";
    p.assessment.atReview = "PARTIAL";
    p.assessment.firstAchievementYear = null;
    expect(verdict(p, AS_OF)).toBe("PENDING");
  });
  it("labels early success correct but excludes it from both mature-cohort rates", () => {
    const p = fixture();
    p.deadline.year = 2030;
    p.assessment.atDeadline = "NOT_DUE";
    p.assessment.firstAchievementYear = 2025;
    expect(verdict(p, AS_OF)).toBe("CORRECT");
    expect(driftYears(p, AS_OF)).toBe(-5);
    const s = summarize([p], AS_OF);
    expect(s.eligible).toBe(0);
    expect(s.onTimeRate).toBeNull();
    expect(s.realizationRate).toBeNull();
    expect(s.drifts).toHaveLength(1);
  });
  it("does not use a future review in an earlier snapshot", () => {
    const p = fixture();
    p.assessment.lastReviewedAt = "2027-01-01";
    expect(verdict(p, AS_OF)).toBe("UNREVIEWED");
    expect(eligibleRecords([p], AS_OF)).toHaveLength(0);
  });
  it("keeps unscorable and excluded states distinct", () => {
    const p = fixture();
    p.assessment.scorable = false;
    expect(verdict(p, AS_OF)).toBe("UNSCORABLE");
    p.assessment.state = "EXCLUDED";
    expect(verdict(p, AS_OF)).toBe("EXCLUDED");
  });
  it("requires confirmed publication dates for forecast horizons", () => {
    const p = fixture();
    expect(forecastHorizon(p)).toBe(10);
    p.sources[0].publicationYearVerified = false;
    expect(forecastHorizon(p)).toBeNull();
  });
});
describe("statistical populations", () => {
  it("uses the same due cohort for on-time and eventual realization without partial points", () => {
    const correct = fixture("CORRECT");
    const late = fixture("LATE");
    late.assessment.atDeadline = "NOT_FULFILLED";
    late.assessment.firstAchievementYear = 2015;
    const partial = fixture("PARTIAL");
    partial.assessment.atDeadline = "PARTIAL";
    partial.assessment.atReview = "PARTIAL";
    partial.assessment.firstAchievementYear = null;
    const missed = fixture("MISSED");
    missed.assessment.atDeadline = "NOT_FULFILLED";
    missed.assessment.atReview = "NOT_FULFILLED";
    missed.assessment.firstAchievementYear = null;
    const future = fixture("FUTURE");
    future.deadline.year = 2030;
    future.assessment.atDeadline = "NOT_DUE";
    const s = summarize(
      [correct, late, partial, missed, future, intake()],
      AS_OF,
    );
    expect(s.eligible).toBe(4);
    expect(s.onTimeRate).toBe(0.25);
    expect(s.realizationRate).toBe(0.5);
    expect(s.breakdown.PARTIAL).toBe(1);
    expect(s.breakdown.MISSED).toBe(1);
    expect(s.eligibleIds).not.toContain("FUTURE");
  });
  it("returns unavailable, never zero percent, for an empty denominator", () => {
    const s = summarize([intake()], AS_OF);
    expect(s.collected).toBe(1);
    expect(s.verified).toBe(0);
    expect(s.onTimeRate).toBeNull();
    expect(s.realizationRate).toBeNull();
    expect(s.meanDrift).toBeNull();
  });
  it("deduplicates scoring keys and ignores repeated tags", () => {
    const a = fixture("A"),
      b = fixture("B");
    b.scoringKey = a.scoringKey;
    a.tags = ["AI", "Computing", "Robotics"];
    expect(summarize([a, b], AS_OF).eligible).toBe(1);
    expect(canonicalRecords([a, b])).toHaveLength(1);
  });
  it("does not allow an unresolved or excluded duplicate into the cohort", () => {
    const p = fixture();
    p.canonical = false;
    expect(eligibleRecords([p], AS_OF)).toHaveLength(0);
    p.canonical = true;
    p.duplicateOf = "ORIGINAL";
    expect(eligibleRecords([p], AS_OF)).toHaveLength(0);
  });
  it("retains revised deadlines without merging a whole forecast family", () => {
    const a = fixture("ORIGINAL"),
      b = fixture("REVISION");
    b.deadline.year = 2019;
    expect(a.familyId).toBe(b.familyId);
    expect(summarize([a, b], AS_OF).eligible).toBe(2);
  });
  it("automatically enables rates when a verified canonical forecast is added", () => {
    const before = [intake()];
    expect(summarize(before, AS_OF).onTimeRate).toBeNull();
    const after = summarize([...before, fixture()], AS_OF);
    expect(after.onTimeRate).toBe(1);
    expect(after.realizationRate).toBe(1);
    expect(after.eligibleIds).toEqual(["TEST-1"]);
  });
  it("omits drift where the achievement year is unknown", () => {
    const p = fixture();
    p.assessment.firstAchievementYear = null;
    expect(summarize([p], AS_OF).realizationRate).toBe(1);
    expect(summarize([p], AS_OF).drifts).toHaveLength(0);
  });
});
