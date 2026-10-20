import { describe, it, expect } from "vitest";
import { AS_OF, predictions, categories } from "../src/lib/data";
import { categoryResults, OUTCOME_ORDER } from "../src/lib/publication";
import { commonCohort, selectReading } from "../src/lib/interpretations";
import { eligibleRecords, summarize } from "../src/lib/scoring";
import { READINGS } from "../src/lib/evidence-model";
const names = categories.map((c) => c.name);
describe("publication charts", () => {
  it("every square represents exactly one eligible forecast in every reading", () => {
    const before = JSON.stringify(predictions);
    for (const reading of READINGS)
      for (const common of [false, true]) {
        const rows = categoryResults(
          predictions,
          names,
          AS_OF,
          reading,
          common,
        );
        const source = (common ? commonCohort(predictions) : predictions).map(
          (p) => selectReading(p, reading),
        );
        const expected = eligibleRecords(source, AS_OF)
          .map((p) => p.id)
          .sort();
        const actual = rows.flatMap((r) => r.records.map((p) => p.id));
        expect(actual.sort()).toEqual(expected);
        expect(new Set(actual).size).toBe(actual.length);
        expect(rows.reduce((s, r) => s + r.realized, 0)).toBe(
          summarize(source, AS_OF).realized,
        );
        const allVisible = rows.flatMap((row) => [
          ...row.records,
          ...row.otherRecords,
        ]);
        expect(new Set(allVisible.map((p) => p.id)).size).toBe(
          predictions.length,
        );
        expect(allVisible).toHaveLength(predictions.length);
        for (const row of rows) {
          expect(row.records).toHaveLength(row.due);
          expect(
            row.records.filter((p) => p.verdict === "CORRECT"),
          ).toHaveLength(row.onTime);
          expect(
            row.records.filter((p) => ["CORRECT", "LATE"].includes(p.verdict)),
          ).toHaveLength(row.realized);
          expect(
            row.records.every((p) =>
              OUTCOME_ORDER.includes(
                p.verdict as (typeof OUTCOME_ORDER)[number],
              ),
            ),
          ).toBe(true);
        }
      }
    expect(JSON.stringify(predictions)).toBe(before);
  });
  it("orders the computing forecasts by target year within each judgment", () => {
    const row = categoryResults(predictions, names, AS_OF).find(
      (r) => r.name === "Computing hardware",
    )!;
    expect(
      row.records
        .filter((p) => p.verdict === "CORRECT")
        .map((p) => [p.id, p.target]),
    ).toEqual([
      ["K002", "2009"],
      ["K005", "2009"],
      ["K046", "2009"],
      ["K052", "2009"],
      ["K050", "2019"],
    ]);
    for (const reading of READINGS) {
      for (const category of categoryResults(
        predictions,
        names,
        AS_OF,
        reading,
      )) {
        for (const outcome of OUTCOME_ORDER) {
          const years = category.records
            .filter((p) => p.verdict === outcome)
            .map((p) => Number(p.target));
          expect(years).toEqual([...years].sort((a, b) => a - b));
        }
      }
    }
  });
  it("keeps small, future-only and empty fields visible without a false zero score", () => {
    const rows = categoryResults(predictions, names, AS_OF);
    expect(rows).toHaveLength(13);
    expect(
      rows.find((r) => r.name === "Manufacturing & materials"),
    ).toMatchObject({ total: 0, due: 0, records: [] });
    expect(rows.find((r) => r.name === "Energy & environment")).toMatchObject({
      total: 2,
      due: 0,
      records: [],
    });
    expect(rows.find((r) => r.name === "Longevity")).toMatchObject({
      total: 3,
      due: 1,
      realized: 0,
    });
  });
  it("the published contrasts reconcile to their actual records", () => {
    const rows = categoryResults(predictions, names, AS_OF);
    for (const [name, due, onTime, realized] of [
      ["Computing hardware", 16, 5, 10],
      ["Biology & medicine", 5, 3, 4],
      ["Networks & communications", 4, 2, 3],
      ["Robotics & transportation", 5, 1, 1],
    ] as const)
      expect(rows.find((r) => r.name === name)).toMatchObject({
        due,
        onTime,
        realized,
      });
  });
});
