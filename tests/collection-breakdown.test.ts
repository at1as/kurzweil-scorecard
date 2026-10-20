import { describe, it, expect } from "vitest";
import { AS_OF, predictions, categories } from "../src/lib/data";
import {
  BREAKDOWN_GROUPS,
  collectionBreakdown,
  type BreakdownGroup,
} from "../src/lib/collection-breakdown";
import {
  defaultFilters,
  filterRecords,
  type Filters,
} from "../src/lib/filters";
import { READINGS } from "../src/lib/evidence-model";
import { OUTCOME_ORDER } from "../src/lib/publication";
const names = categories.map((c) => c.name);

describe("optional collection breakdown", () => {
  it("every count matches its ledger filter in all groups and interpretations", () => {
    const before = JSON.stringify(predictions);
    for (const reading of READINGS) {
      for (const group of Object.keys(BREAKDOWN_GROUPS) as BreakdownGroup[]) {
        const { summary, groups } = collectionBreakdown(
          predictions,
          AS_OF,
          reading,
          group,
          names,
        );
        expect(summary).toMatchObject({
          total: 84,
          due: reading === "strict" ? 67 : 68,
          future: reading === "strict" ? 15 : 14,
          undated: 2,
        });
        for (const key of ["total", "due", "future", "undated"] as const)
          expect(groups.reduce((sum, g) => sum + g[key], 0)).toBe(summary[key]);
        for (const g of groups) {
          const ledger = (filters: Partial<Filters> = {}) =>
            filterRecords(
              predictions,
              { ...defaultFilters, reading, [group]: g.key, ...filters },
              AS_OF,
            );
          expect(ledger()).toHaveLength(g.total);
          expect(ledger({ cohort: "eligible" })).toHaveLength(g.due);
          expect(ledger({ view: "future" })).toHaveLength(g.future);
          expect(ledger({ cohort: "undated" })).toHaveLength(g.undated);
          for (const verdict of OUTCOME_ORDER)
            expect(ledger({ cohort: "eligible", verdict })).toHaveLength(
              g.outcomes[verdict],
            );
          expect(
            Object.values(g.outcomes).reduce((sum, count) => sum + count, 0),
          ).toBe(g.due);
          expect(g.due + g.future + g.undated).toBe(g.total);
        }
      }
    }
    expect(JSON.stringify(predictions)).toBe(before);
  });
  it("keeps empty fields visible and moves the brain forecast outside due outcomes in the strict reading", () => {
    const reference = collectionBreakdown(
      predictions,
      AS_OF,
      "reference",
      "category",
      names,
    );
    const strict = collectionBreakdown(
      predictions,
      AS_OF,
      "strict",
      "category",
      names,
    );
    expect(
      reference.groups.find((g) => g.label === "Manufacturing & materials"),
    ).toMatchObject({ total: 0, due: 0 });
    expect(
      reference.groups.find((g) => g.label === "Energy & environment"),
    ).toMatchObject({ total: 2, due: 0, future: 2 });
    const brain = predictions.find((p) => p.id === "K036")!.category;
    expect(reference.groups.find((g) => g.key === brain)).toMatchObject({
      total: 5,
      due: 2,
      future: 3,
    });
    expect(strict.groups.find((g) => g.key === brain)).toMatchObject({
      total: 5,
      due: 1,
      future: 4,
    });
  });
});
