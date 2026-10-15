import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";
import data from "../data/generated/predictions.json";
import spec from "../data/generated/specification.json";
import config from "../data/config.json";
import { validateDataset } from "../src/lib/validation";
import { fixture, AS_OF } from "./fixtures";
const categories = spec.categories.map((c) => c.name);
const validate = (rows: unknown) => validateDataset(rows, categories, AS_OF);
describe("data provenance", () => {
  it("preserves every original row and field with a matching input hash", () => {
    const bytes = fs.readFileSync(config.intakeFile);
    const original = parse(bytes, {
      bom: true,
      columns: true,
      skip_empty_lines: true,
    }) as Record<string, string>[];
    expect(original).toHaveLength(88);
    const hash = createHash("sha256").update(bytes).digest("hex");
    for (const [index, row] of original.entries()) {
      const p = data.find((p) => p.id === row["Record ID"]);
      expect(p?.provenance.raw).toEqual(row);
      expect(p?.provenance.row).toBe(index + 2);
      expect(p?.provenance.inputSha256).toBe(hash);
      expect(row["Review state"]).toBe("UNREVIEWED");
    }
  });
  it("uses all thirteen workbook domains and preserved coverage entries", () => {
    expect(categories).toHaveLength(13);
    expect(spec.coverage).toHaveLength(13);
    expect(validateDataset(data, categories, config.asOf)).toHaveLength(
      data.length,
    );
  });
});
describe("review integrity validation", () => {
  it("accepts a complete verified record", () =>
    expect(validate([fixture()])).toHaveLength(1));
  it("rejects duplicate IDs and duplicate canonical keys", () => {
    expect(() => validate([fixture(), fixture()])).toThrow(/duplicate record/);
    const b = fixture("TEST-2");
    b.scoringKey = "TEST-1";
    expect(() => validate([fixture(), b])).toThrow(/scoring key/);
  });
  it("rejects verified outcomes with no evidence or original locator", () => {
    const p = fixture();
    p.evidence = [];
    expect(() => validate([p])).toThrow(/evidence/);
    p.evidence = fixture().evidence;
    p.sources[0].locator = null;
    expect(() => validate([p])).toThrow(/locator/);
  });
  it("rejects missing success criteria", () => {
    const p = fixture();
    p.successCriteria = null;
    expect(() => validate([p])).toThrow(/criteria/);
  });
  it("rejects a fabricated achievement year on an unmet claim", () => {
    const p = fixture();
    p.assessment.atDeadline = "NOT_FULFILLED";
    p.assessment.atReview = "NOT_FULFILLED";
    expect(() => validate([p])).toThrow(/achievement/);
  });
  it("rejects a late verdict for a year-only target achieved within that same year", () => {
    const p = fixture();
    p.assessment.atDeadline = "NOT_FULFILLED";
    expect(() => validate([p])).toThrow(/late outcome contradicts/);
    p.deadline.precision = "EXACT_DATE";
    p.deadline.exactDate = "2009-01-01";
    expect(validate([p])).toHaveLength(1);
  });
  it("rejects chronology contradictions", () => {
    const p = fixture();
    p.assessment.firstAchievementYear = 2015;
    expect(() => validate([p])).toThrow(/contradicts/);
    p.assessment.firstAchievementYear = 2027;
    expect(() => validate([p])).toThrow(/after the review/);
  });
  it("rejects newly due claims without a fresh post-deadline assessment", () => {
    const p = fixture();
    p.deadline.year = 2025;
    p.assessment.lastReviewedAt = "2025-01-01";
    expect(() => validate([p])).toThrow(/after its deadline/);
  });
  it("rejects fake calendar dates and unsafe source URLs", () => {
    const p = fixture();
    p.assessment.lastReviewedAt = "2026-02-30";
    expect(() => validate([p])).toThrow();
    p.assessment.lastReviewedAt = AS_OF;
    p.sources[0].url = "javascript:alert(1)";
    expect(() => validate([p])).toThrow();
  });
  it("requires explained exclusions and disputes", () => {
    const p = fixture();
    p.assessment.state = "EXCLUDED";
    expect(() => validate([p])).toThrow(/exclusion needs/);
    p.assessment.state = "VERIFIED";
    p.assessment.disputed = true;
    expect(() => validate([p])).toThrow(/alternative/);
  });
  it("rejects unresolved duplicate chains and unknown categories", () => {
    const p = fixture();
    p.canonical = false;
    p.duplicateOf = "MISSING";
    expect(() => validate([p])).toThrow(/retained original/);
    p.duplicateOf = null;
    p.category = "Invented";
    expect(() => validate([p])).toThrow(/unknown primary/);
  });
});
