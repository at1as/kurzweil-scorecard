import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";
import {
  predictions,
  originalIntake,
  allRecords,
  categories,
  evidenceSources,
  AS_OF,
} from "../src/lib/data";
import {
  summarize,
  eligibleRecords,
  verdict,
  driftYears,
} from "../src/lib/scoring";
import { READINGS } from "../src/lib/evidence-model";
import {
  selectReading,
  commonCohort,
  deadlineOutcome,
  reviewOutcome,
} from "../src/lib/interpretations";
import {
  filterRecords,
  defaultFilters,
  exportCsv,
  parseFilters,
  serializeFilters,
} from "../src/lib/filters";
import { validateDataset } from "../src/lib/validation";
import raw from "../kurzweil_verification_v0_4_package/predictions.canonical.v0.4.json";
import prior from "../kurzweil_verification_v0_2/predictions.canonical.v0.2.json";
import metrics from "../kurzweil_verification_v0_4_package/metrics.v0.4.json";
import manifestV03 from "../kurzweil_verification_v0_3_package/MANIFEST.json";
import manifestV04 from "../kurzweil_verification_v0_4_package/MANIFEST.json";
const sorted = (a: string[]) => [...a].sort();
const record = (id: string) => predictions.find((p) => p.id === id)!;
describe("v0.4 release integration", () => {
  it("imports exactly 81 lossless canonical objects after consolidating 3 duplicates", () => {
    expect(predictions.map((p) => p.release)).toEqual(raw.records);
    expect(predictions).toHaveLength(81);
    expect(allRecords).toHaveLength(169);
    expect(new Set(allRecords.map((p) => p.id)).size).toBe(169);
    expect(evidenceSources).toHaveLength(103);
    expect(categories).toHaveLength(13);
    expect(
      validateDataset(
        predictions,
        categories.map((c) => c.name),
        AS_OF,
      ),
    ).toHaveLength(81);
    for (const p of predictions) {
      for (const e of p.evidence) {
        expect(e.note).not.toContain(".. ");
      }
    }
    expect(evidenceSources.find((s) => s.id === "N06")?.url).toContain(
      "/en-us/guide/airpods/",
    );
    expect(evidenceSources.find((s) => s.id === "N71")?.url).not.toContain(
      "/ci/",
    );
    expect(evidenceSources.find((s) => s.id === "N72")?.url).not.toContain(
      "/is-is/",
    );
    expect(evidenceSources.find((s) => s.id === "P02")?.url).toBe(
      "https://archive.org/details/ageofspiritualma00kurz",
    );
  });
  it("preserves all earlier assessments, original fields, and v0.3/v0.4 package bytes", () => {
    const historyAssessments = new Set(
      predictions.flatMap((p) =>
        (p.release!.revision_history ?? []).map((h) =>
          JSON.stringify(h.previous_assessment),
        ),
      ),
    );
    for (const old of prior.records) {
      expect(historyAssessments.has(JSON.stringify(old.assessment))).toBe(true);
    }
    expect(originalIntake).toHaveLength(88);
    for (const p of originalIntake) {
      expect(p.provenance.raw["Prediction — imported lead"]).toBe(
        p.importedClaim,
      );
      expect(
        p.reconciliation?.conditional_outcome?.eligible_for_author_accuracy,
      ).toBe(false);
      expect(p.research.history.map((h) => h.date)).toEqual([
        "2026-10-14",
        "2026-10-15",
      ]);
    }
    for (const f of manifestV03.files) {
      const file = `kurzweil_verification_v0_3_package/${f.name}`,
        b = fs.readFileSync(file);
      expect(createHash("sha256").update(b).digest("hex")).toBe(f.sha256);
      expect(
        fs.readFileSync(`public/data/releases/v0.3/${f.name}`).equals(b),
      ).toBe(true);
    }
    for (const f of manifestV04.files) {
      const file = `kurzweil_verification_v0_4_package/${f.name}`,
        b = fs.readFileSync(file);
      expect(createHash("sha256").update(b).digest("hex")).toBe(f.sha256);
      expect(
        fs.readFileSync(`public/data/releases/v0.4/${f.name}`).equals(b),
      ).toBe(true);
    }
  });
  for (const mode of READINGS)
    it(`recomputes ${mode} native and common cohorts with exact contributing IDs`, () => {
      for (const common of [false, true]) {
        const rows = (common ? commonCohort(predictions) : predictions).map(
          (p) => selectReading(p, mode),
        );
        const s = summarize(rows, AS_OF),
          m = common
            ? metrics.common_cohort_excluding_deadline_boundary[mode]
            : metrics.views[mode];
        expect(s.eligible).toBe(m.n);
        expect(s.onTime).toBe(m.on_time);
        expect(s.realized).toBe(m.fully_realized_by_review);
        expect(s.onTimeRate).toBe(m.on_time_rate);
        expect(s.realizationRate).toBe(m.realization_rate);
        expect(s.currentUnknown).toBe(0);
        expect(sorted(s.eligibleIds)).toEqual(sorted(m.eligible_ids));
        expect(sorted(s.onTimeIds)).toEqual(sorted(m.on_time_ids));
        expect(sorted(s.realizedIds)).toEqual(sorted(m.fully_realized_ids));
        const filtered = filterRecords(
          allRecords,
          {
            ...defaultFilters,
            reading: mode,
            cohort: common ? "common" : "eligible",
          },
          AS_OF,
        );
        expect(sorted(filtered.map((p) => p.id))).toEqual(
          sorted(m.eligible_ids),
        );
      }
      for (const c of categories) {
        const s = summarize(
          predictions
            .filter((p) => p.category === c.name)
            .map((p) => selectReading(p, mode)),
          AS_OF,
        );
        const m =
          metrics.by_category[c.name as keyof typeof metrics.by_category]?.[
            mode
          ];
        expect(s.eligible).toBe(m?.n ?? 0);
        expect(s.onTime).toBe(m?.on_time ?? 0);
      }
    });
  it("unifies K036 across all readings and keeps future claims pending in Charitable", () => {
    for (const mode of READINGS) {
      const k036 = selectReading(record("K036"), mode);
      expect(k036.deadline.year).toBe(2026);
      expect(verdict(k036, AS_OF)).toBe("PENDING");
      expect(eligibleRecords([k036], AS_OF)).toEqual([]);
    }
    const early = predictions
      .map((p) => selectReading(p, "broader"))
      .filter(
        (p) =>
          verdict(p, AS_OF) === "CORRECT" && deadlineOutcome(p) === "NOT_DUE",
      );
    expect(early).toHaveLength(0);
    expect(
      predictions.filter(
        (p) => p.release?.assessment.at_deadline === "NOT_DUE",
      ),
    ).toHaveLength(15);
    expect(
      filterRecords(
        allRecords,
        { ...defaultFilters, cohort: "undated" },
        AS_OF,
      ),
    ).toHaveLength(2);
  });
  it("retains exact events across all readings, evidence bounds and editorial eras without inventing first years", () => {
    expect(verdict(record("K001"), AS_OF)).toBe("CORRECT");
    expect(record("K001").release?.timing?.drift_range_years).toEqual([-3, -1]);
    expect(driftYears(record("K001"), AS_OF)).toBeNull();
    expect(driftYears(selectReading(record("K033"), "reference"), AS_OF)).toBe(
      4,
    );
    expect(driftYears(selectReading(record("K033"), "strict"), AS_OF)).toBe(4);
    expect(driftYears(selectReading(record("K033"), "broader"), AS_OF)).toBe(3);
    expect(record("K002").assessment.firstAchievementYear).toBeNull();
    expect(record("K002").release?.timing?.documented_by_year).toBe(2008);
    for (const p of predictions.filter(
      (p) => p.release?.timing?.kind === "EDITORIAL_ERA_BOUND",
    )) {
      expect(p.assessment.firstAchievementYear).toBeNull();
      expect(driftYears(p, AS_OF)).toBeNull();
    }
  });
  it("keeps conditional and non-scoring comparators outside every author cohort", () => {
    expect(
      originalIntake.filter(
        (p) =>
          p.reconciliation?.conditional_outcome?.assessment_basis ===
          "CONDITIONAL_ON_IMPORTED_WORDING_NOT_VERIFIED_ATTRIBUTION",
      ),
    ).toHaveLength(46);
    expect(eligibleRecords(originalIntake, AS_OF)).toEqual([]);
    expect(summarize(allRecords, AS_OF).eligible).toBe(64);
    for (const id of ["K041", "K048", "K064", "K083"]) {
      const p = record(id);
      expect(p.release?.non_scoring_comparators?.length).toBeGreaterThan(0);
      expect(summarize([p], AS_OF).collected).toBe(1);
    }
  });
  it("round-trips reading URLs and exports the selected criteria and outcomes", () => {
    const f = { ...defaultFilters, reading: "strict" as const, q: "K036" };
    expect(parseFilters(new URLSearchParams(serializeFilters(f)))).toEqual(f);
    const rows = filterRecords(allRecords, f, AS_OF);
    expect(rows).toHaveLength(1);
    const csv = parse(exportCsv(rows, AS_OF), { columns: true }) as Record<
      string,
      string
    >[];
    expect(csv[0].Reading).toBe("strict");
    expect(csv[0]["At deadline"]).toBe("NOT_DUE");
    expect(csv[0]["Confirmed deadline"]).toBe("2026");
    expect(csv[0]["Deadline metrics eligible"]).toBe("false");
    expect(reviewOutcome(record("K033"))).toBe("FULFILLED");
  });
  it("rejects promotion of future eligibility or rewritten reference history fields", () => {
    const p = structuredClone(record("K036"));
    p.release!.interpretations!.strict.eligible_for_deadline_metrics = true;
    expect(() =>
      validateDataset(
        [p],
        categories.map((c) => c.name),
        AS_OF,
      ),
    ).toThrow(/eligible deadline/);
    const q = structuredClone(record("K002"));
    q.assessment.firstAchievementYear = 2008;
    expect(() =>
      validateDataset(
        [q],
        categories.map((c) => c.name),
        AS_OF,
      ),
    ).toThrow(/evidence bound/);
  });
});
