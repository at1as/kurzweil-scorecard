import { describe, expect, it } from "vitest";
import { allRecords, AS_OF } from "../src/lib/data";
import { evidenceSummary } from "../src/lib/evidence-summary";
import { READINGS } from "../src/lib/evidence-model";
import { selectReading } from "../src/lib/interpretations";
import { eligibleRecords, verdict } from "../src/lib/scoring";

describe("evidence panel summaries", () => {
  it("retains all judgments, criteria, evidence, and source URLs without changing the records", () => {
    const original = JSON.stringify(allRecords);
    for (const p of allRecords) {
      const summary = evidenceSummary(p, AS_OF);
      expect(summary.sources).toEqual(p.sources);
      for (const reading of READINGS) {
        const selected = selectReading(p, reading);
        const view = summary.views[reading];
        expect(view.verdict).toBe(verdict(selected, AS_OF));
        expect(view.criterion).toBe(selected.successCriteria);
        expect(view.rationale).toBe(selected.assessment.rationale);
        expect(view.deadline).toBe(selected.deadline.year);
        expect(view.eligible).toBe(
          eligibleRecords([selected], AS_OF).length > 0,
        );
        expect(view.evidence).toEqual(p.evidence);
        for (const id of p.release?.interpretations?.[reading]
          .evidence_source_ids ?? []) {
          expect(view.evidence.some((source) => source.sourceId === id)).toBe(
            true,
          );
        }
      }
    }
    expect(JSON.stringify(allRecords)).toBe(original);
  });
  it("keeps the brain-modeling deadline disagreement and original intake exclusions visible", () => {
    const brain = evidenceSummary(
      allRecords.find((p) => p.id === "K036")!,
      AS_OF,
    );
    expect(brain.views.reference).toMatchObject({
      deadline: 2025,
      eligible: true,
      verdict: "PARTIAL",
    });
    expect(brain.views.strict).toMatchObject({
      deadline: 2026,
      eligible: false,
      verdict: "PENDING",
    });
    const intake = evidenceSummary(
      allRecords.find((p) => p.id === "AUD-001")!,
      AS_OF,
    );
    expect(intake.legacy).not.toBeNull();
    expect(intake.views.reference.eligible).toBe(false);
  });
});
