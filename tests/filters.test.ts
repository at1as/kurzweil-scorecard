import { describe, it, expect } from "vitest";
import { parse } from "csv-parse/sync";
import {
  defaultFilters,
  exportCsv,
  filterRecords,
  futureCandidate,
  parseFilters,
  serializeFilters,
  targetDecade,
  publicationDecade,
  sortValue,
} from "../src/lib/filters";
import { fixture, intake, AS_OF } from "./fixtures";
describe("search, filters and shareable state", () => {
  it("combines filters instead of treating them as alternatives", () => {
    const a = fixture("A"),
      b = fixture("B");
    a.importedClaim = "Computers play chess";
    b.category = "Longevity";
    b.importedClaim = "Computers play chess";
    const f = {
      ...defaultFilters,
      q: "computers chess",
      category: "AI & software",
      target: "2000s",
      verification: "VERIFIED",
      verdict: "CORRECT",
    };
    expect(filterRecords([a, b], f, AS_OF).map((p) => p.id)).toEqual(["A"]);
  });
  it("matches multiple search words, tags and sources", () => {
    const a = fixture();
    expect(
      filterRecords(
        [a],
        {
          ...defaultFilters,
          q: "synthetic reasoning",
          tag: "Reasoning",
          source: "Synthetic test source",
        },
        AS_OF,
      ),
    ).toHaveLength(1);
  });
  it("round-trips every supported filter including pagination", () => {
    const f = {
      ...defaultFilters,
      q: "AI & future",
      category: "AI & software",
      tag: "AI/Games",
      source: "Book (1999)",
      publication: "1990s",
      target: "2000s",
      verification: "VERIFIED",
      verdict: "CORRECT",
      type: "CAPABILITY",
      horizon: "10–19 years",
      cohort: "eligible",
      view: "verified" as const,
      sort: "target" as const,
      order: "desc" as const,
      page: 4,
      size: 30,
    };
    expect(parseFilters(new URLSearchParams(serializeFilters(f)))).toEqual(f);
  });
  it("sanitizes malformed page size, sort, and view values", () => {
    const f = parseFilters(
      new URLSearchParams(
        "page=-8&size=9999&view=nope&sort=arbitrary&order=nope",
      ),
    );
    expect(f).toEqual(defaultFilters);
  });
  it("keeps unconfirmed publication years out of verified decade analytics", () => {
    const p = fixture();
    p.sources[0].publicationYearVerified = false;
    expect(publicationDecade(p)).toBe("Unresolved");
    expect(publicationDecade(intake())).toBe("1990s");
  });
  it("keeps future candidates unreviewed instead of manufacturing pending verdicts", () => {
    const p = intake();
    p.deadline.originalText = "early 2030s";
    expect(futureCandidate(p, AS_OF)).toBe(true);
    expect(
      filterRecords([p], { ...defaultFilters, view: "future" }, AS_OF),
    ).toHaveLength(1);
    expect(
      filterRecords([p], { ...defaultFilters, verdict: "PENDING" }, AS_OF),
    ).toHaveLength(0);
  });
  it("does not give multi-decade targets a false single date", () => {
    const p = intake();
    p.deadline.originalText = "2009, 2019, 2029";
    expect(targetDecade(p)).toBe("Unresolved");
    p.deadline.originalText = "mid-2020s";
    expect(targetDecade(p)).toBe("2020s");
    expect(p.deadline.year).toBeNull();
  });
  it("drills to exactly the eligible population", () => {
    expect(
      filterRecords(
        [fixture(), intake()],
        { ...defaultFilters, cohort: "eligible" },
        AS_OF,
      ).map((p) => p.id),
    ).toEqual(["TEST-1"]);
  });
  it("preserves actual numeric values for sorting, with missing values undefined", () => {
    const a = fixture();
    expect(sortValue(a, "target", AS_OF)).toBe(2009);
    expect(sortValue(a, "drift", AS_OF)).toBe(0);
    expect(sortValue(intake(), "actual", AS_OF)).toBeUndefined();
  });
});
describe("filtered CSV export", () => {
  it("escapes quotes, commas and newlines and includes provenance", () => {
    const p = intake();
    p.importedClaim = 'A "quoted", multiline\nclaim';
    const result = parse(exportCsv([p], AS_OF), { columns: true }) as Record<
      string,
      string
    >[];
    expect(result).toHaveLength(1);
    expect(result[0]["Prediction (editorial/imported)"]).toBe(p.importedClaim);
    expect(result[0]["Snapshot date"]).toBe(AS_OF);
    expect(result[0]["Verdict"]).toBe("UNREVIEWED");
  });
  it("neutralizes spreadsheet formula injection in imported text", () => {
    const p = intake();
    p.importedClaim = '=HYPERLINK("https://example.org")';
    const result = parse(exportCsv([p], AS_OF), { columns: true }) as Record<
      string,
      string
    >[];
    expect(result[0]["Prediction (editorial/imported)"]).toMatch(/^'/);
  });
});
