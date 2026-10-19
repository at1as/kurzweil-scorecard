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
import raw from "../kurzweil_verification_v0_3_package/predictions.canonical.v0.3.json";
import prior from "../kurzweil_verification_v0_2/predictions.canonical.v0.2.json";
import metrics from "../kurzweil_verification_v0_3_package/metrics.v0.3.json";
import manifest from "../kurzweil_verification_v0_3_package/MANIFEST.json";
const sorted = (a: string[]) => [...a].sort();
const record = (id: string) => predictions.find((p) => p.id === id)!;
describe("v0.3 release integration", () => {
  it("imports exactly 84 lossless canonical objects, adding 34 rather than appending 84", () => {
    expect(predictions.map((p) => p.release)).toEqual(raw.records);
    expect(predictions.filter((p) => p.release?.is_new_in_v03)).toHaveLength(
      34,
    );
    expect(allRecords).toHaveLength(172);
    expect(new Set(allRecords.map((p) => p.id)).size).toBe(172);
    expect(evidenceSources).toHaveLength(103);
    expect(categories).toHaveLength(13);
    expect(
      validateDataset(
        predictions,
        categories.map((c) => c.name),
        AS_OF,
      ),
    ).toHaveLength(84);
  });
  it("preserves all earlier assessments, original fields, and package bytes", () => {
    for (const old of prior.records) {
      const p = record(old.id);
      expect(
        p.release!.revision_history!.some(
          (h) =>
            JSON.stringify(h.previous_assessment) ===
            JSON.stringify(old.assessment),
        ),
      ).toBe(true);
      expect(p.research.history.some((h) => h.date === "2026-10-14")).toBe(
        true,
      );
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
    for (const f of manifest.files) {
      const file = `kurzweil_verification_v0_3_package/${f.name}`,
        b = fs.readFileSync(file);
      expect(createHash("sha256").update(b).digest("hex")).toBe(f.sha256);
      expect(fs.readFileSync(`public/data/releases/v0.3/${f.name}`)).toEqual(b);
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
  it("handles K036's boundary and future early successes without changing denominators", () => {
    expect(
      eligibleRecords([selectReading(record("K036"), "reference")], AS_OF),
    ).toHaveLength(1);
    const alternative = selectReading(record("K036"), "strict");
    expect(alternative.deadline.year).toBe(2026);
    expect(verdict(alternative, AS_OF)).toBe("PENDING");
    expect(eligibleRecords([alternative], AS_OF)).toEqual([]);
    const early = predictions
      .map((p) => selectReading(p, "broader"))
      .filter(
        (p) =>
          verdict(p, AS_OF) === "CORRECT" && deadlineOutcome(p) === "NOT_DUE",
      );
    expect(early.length).toBeGreaterThan(0);
    expect(eligibleRecords(early, AS_OF)).toEqual([]);
    expect(
      predictions.filter(
        (p) => p.release?.assessment.at_deadline === "NOT_DUE",
      ),
    ).toHaveLength(14);
    expect(
      filterRecords(
        allRecords,
        { ...defaultFilters, cohort: "undated" },
        AS_OF,
      ),
    ).toHaveLength(2);
  });
  it("retains exact events, evidence bounds and editorial eras without inventing first years", () => {
    expect(verdict(record("K001"), AS_OF)).toBe("CORRECT");
    expect(record("K001").release?.timing?.drift_range_years).toEqual([-3, -1]);
    expect(driftYears(record("K001"), AS_OF)).toBeNull();
    expect(driftYears(record("K033"), AS_OF)).toBe(4);
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
    expect(summarize(allRecords, AS_OF).eligible).toBe(68);
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
