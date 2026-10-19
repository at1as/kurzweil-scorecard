import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";
import type { Prediction } from "../src/lib/model";
import oldSite from "../data/releases/v0.2/predictions.json";
import original from "../data/generated/predictions.json";
import oldMapping from "../kurzweil_verification_v0_2/legacy-reconciliation.v0.2.json";
import oldSources from "../kurzweil_verification_v0_2/sources.v0.2.json";
import spec from "../data/generated/specification.json";
const predictions = oldSite.predictions as Prediction[],
  reconciliation = oldMapping.mapping,
  evidenceSources = oldSources.sources,
  categories = spec.categories,
  AS_OF = "2026-10-14";
const originalIntake = (original as Prediction[]).map((p) => ({
  ...p,
  reconciliation: reconciliation.find(
    (m) => m.legacy_id === p.id,
  ) as Prediction["reconciliation"],
  research: {
    ...p.research,
    history: [
      {
        date: AS_OF,
        note: reconciliation.find((m) => m.legacy_id === p.id)!.reason,
      },
    ],
  },
}));
const allRecords = [...predictions, ...originalIntake];
import {
  summarize,
  eligibleRecords,
  verdict,
  driftYears,
} from "../src/lib/scoring";
import { filterRecords, defaultFilters, exportCsv } from "../src/lib/filters";
import { validateDataset } from "../src/lib/validation";
import snapshot from "../kurzweil_verification_v0_2/metrics.snapshot.v0.2.json";
import manifest from "../kurzweil_verification_v0_2/MANIFEST.json";
import raw from "../kurzweil_verification_v0_2/predictions.canonical.v0.2.json";
const record = (id: string) =>
  structuredClone(predictions.find((p) => p.id === id)!);
const validate = (rows: unknown) =>
  validateDataset(
    rows,
    categories.map((c) => c.name),
    AS_OF,
  );
describe("v0.2 evidence integration", () => {
  it("retains immutable release bytes and every authoritative record", () => {
    for (const file of manifest.files) {
      const bytes = fs.readFileSync(`kurzweil_verification_v0_2/${file.name}`);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        file.sha256,
      );
      expect(fs.readFileSync(`public/data/releases/v0.2/${file.name}`)).toEqual(
        bytes,
      );
    }
    expect(predictions.map((p) => p.release)).toEqual(raw.records);
    expect(evidenceSources).toHaveLength(32);
    expect(validate(predictions)).toHaveLength(50);
  });
  it("keeps all original routes and field history without redirects or inherited scores", () => {
    expect(originalIntake).toHaveLength(88);
    expect(allRecords).toHaveLength(138);
    expect(new Set(allRecords.map((p) => p.id)).size).toBe(138);
    for (const p of originalIntake) {
      expect(p.reconciliation?.automatic_redirect).toBe(false);
      expect(p.importedClaim).toBe(p.reconciliation?.original_prediction);
      expect(p.deadline.originalText).toBe(
        p.reconciliation?.original_target_text,
      );
      expect(verdict(p, AS_OF)).toBe("UNREVIEWED");
      expect(p.research.history.at(-1)?.note).toContain(
        p.reconciliation!.reason,
      );
    }
    expect(eligibleRecords(originalIntake, AS_OF)).toEqual([]);
    expect(
      reconciliation.find((m) => m.legacy_id === "AUD-025")?.canonical_ids,
    ).toContain("K024");
    expect(record("K024").deadline.year).toBe(2029);
    expect(
      originalIntake.find((p) => p.id === "AUD-025")?.deadline.originalText,
    ).toContain("2019");
  });
  it("recomputes the exact supplied subset without conflating populations", () => {
    const stats = summarize(predictions, AS_OF);
    expect(stats.collected).toBe(snapshot.curated_records);
    expect(stats.verified).toBe(34);
    expect(stats.unreviewed).toBe(16);
    expect(stats.eligible).toBe(snapshot.default_deadline_eligible_n);
    expect(stats.eligibleBreakdown).toMatchObject({
      CORRECT: 2,
      PARTIAL: 6,
      MISSED: 5,
      LATE: 0,
      PENDING: 0,
    });
    expect(stats.onTimeRate).toBe(
      snapshot.strict_on_time_rate_reviewed_subset_only,
    );
    expect(stats.currentUnknown).toBe(9);
    expect(stats.realizationRate).toBeNull();
    expect(
      summarize(
        predictions.filter((p) => p.id !== "K002"),
        AS_OF,
      ).eligible,
    ).toBe(12);
    expect(
      summarize(
        predictions.filter((p) => p.id !== "K002"),
        AS_OF,
      ).onTime,
    ).toBe(1);
  });
  it("retains assessed partial verdicts when current fulfillment remains unknown", () => {
    const partial = predictions.find(
      (p) =>
        p.release?.assessment.verdict === "PARTIAL" &&
        p.release.assessment.at_review === "FULL_FULFILLMENT_NOT_ESTABLISHED",
    )!;
    expect(verdict(partial, AS_OF)).toBe("PARTIAL");
    expect(summarize([partial], AS_OF).realizationRate).toBeNull();
    expect(
      filterRecords(
        predictions,
        { ...defaultFilters, view: "verified" },
        AS_OF,
      ),
    ).toHaveLength(34);
    for (const p of predictions.filter(
      (p) => p.assessment.state === "SOURCE_CONFIRMED",
    ))
      expect(verdict(p, AS_OF)).toBe("UNREVIEWED");
  });
  it("does not fabricate first-achievement dates or exact drift", () => {
    expect(summarize(predictions, AS_OF).drifts).toEqual([]);
    const hardware = record("K033");
    expect(verdict(hardware, AS_OF)).toBe("LATE");
    expect(hardware.release?.assessment.drift_range_years).toEqual([3, 4]);
    expect(eligibleRecords([hardware], AS_OF)).toEqual([]);
    expect(driftYears(hardware, AS_OF)).toBeNull();
    expect(record("K002").assessment.firstAchievementYear).toBeNull();
    expect(
      record("K002").release?.assessment.full_achievement_documented_by_year,
    ).toBe(2008);
    expect(record("K001").assessment.firstAchievementYear).toBe(1997);
    expect(record("K001").deadline.year).toBeNull();
    expect(driftYears(record("K001"), AS_OF)).toBeNull();
  });
  it("excludes approximate and pending dates and keeps all thirteen categories", () => {
    expect(categories).toHaveLength(13);
    expect(categories.some((c) => c.name === "Manufacturing & materials")).toBe(
      true,
    );
    expect(
      predictions.filter((p) => p.category === "Manufacturing & materials"),
    ).toEqual([]);
    for (const p of predictions.filter(
      (p) => p.release?.assessment.verdict === "PENDING",
    ))
      expect(eligibleRecords([p], AS_OF)).toEqual([]);
    const vague = predictions.filter(
      (p) =>
        p.release?.target.precision !== "YEAR" &&
        p.release?.target.deadline_year === null,
    );
    expect(vague.length).toBeGreaterThan(0);
    for (const p of vague) expect(p.deadline.year).toBeNull();
  });
  it("rejects unsafe promotion of a proxy or invented achievement year", () => {
    const p = record("K033");
    p.release!.assessment.eligible_for_deadline_metrics = true;
    expect(() => validate([p])).toThrow(/interval/);
    const q = record("K002");
    q.assessment.firstAchievementYear = 2008;
    expect(() => validate([q])).toThrow(/evidence bound/);
    const r = record("K003");
    r.release!.assessment.verdict = "CORRECT";
    expect(() => validate([r])).toThrow(/source confirmation/);
  });
  it("exports original outcome states, proxy qualifiers, bounds, and subset scope", () => {
    const rows = parse(exportCsv([record("K002"), record("K033")], AS_OF), {
      columns: true,
    }) as Record<string, string>[];
    expect(rows[0]["Actual year"]).toBe("");
    expect(rows[0]["Documented by year (not first year)"]).toBe("2008");
    expect(rows[1]["At review"]).toBe("FULFILLED_UNDER_STATED_HARDWARE_PROXY");
    expect(rows[1]["Deadline metrics eligible"]).toBe("false");
    expect(rows[1]["Drift interval"]).toBe("3–4");
    expect(rows[1].Scope).toContain("not lifetime accuracy");
  });
  it("keeps original intake search isolated from curated populations", () => {
    expect(filterRecords(allRecords, defaultFilters, AS_OF)).toHaveLength(50);
    expect(
      filterRecords(allRecords, { ...defaultFilters, view: "intake" }, AS_OF),
    ).toHaveLength(88);
    expect(
      filterRecords(
        allRecords,
        { ...defaultFilters, cohort: "eligible" },
        AS_OF,
      ),
    ).toHaveLength(13);
    expect(
      filterRecords(allRecords, { ...defaultFilters, q: "AUD-025" }, AS_OF).map(
        (p) => p.id,
      ),
    ).toContain("K024");
  });
});
