import { describe, it, expect } from "vitest";
import {
  predictions,
  AS_OF,
  researchSupplement,
  evidenceSources,
} from "../src/lib/data";
import { summarize } from "../src/lib/scoring";
import {
  applyCitationSupplement,
  citationSupplementSchema,
} from "../src/lib/research-supplement";
import { adaptEvidence } from "../src/lib/evidence";
import { loadEvidence, evidenceFile, sha } from "../scripts/evidence-input";
import { commonCohort, selectReading } from "../src/lib/interpretations";
import { READINGS } from "../src/lib/evidence-model";
describe("dated primary citation supplement", () => {
  it("fills every original blank evidence locator without changing raw release objects", () => {
    const affected = new Set<string>();
    let missing = 0;
    for (const p of predictions)
      for (const ref of p.release!.evidence)
        if (!ref.locator) {
          missing++;
          affected.add(p.id);
          const c = researchSupplement.citations.find(
            (c) => c.record_id === p.id && c.source_id === ref.source_id,
          );
          expect(c?.locator.length).toBeGreaterThan(10);
          expect(
            p.evidence.find((e) => e.sourceId === ref.source_id)?.note,
          ).toContain(c!.locator);
          expect(ref.locator).toBe("");
        }
    expect(missing).toBe(15);
    expect(affected.size).toBe(9);
  });
  it("retains all outcomes, interpretation criteria, cohort IDs and timing across the supplement", () => {
    const { release, sources } = loadEvidence();
    const base = release.records.map((r) =>
      adaptEvidence(r, sources, evidenceFile, sha(evidenceFile)),
    );
    for (const mode of READINGS) {
      expect(
        summarize(
          predictions.map((p) => selectReading(p, mode)),
          AS_OF,
        ),
      ).toEqual(
        summarize(
          base.map((p) => selectReading(p, mode)),
          AS_OF,
        ),
      );
      expect(
        summarize(
          commonCohort(predictions).map((p) => selectReading(p, mode)),
          AS_OF,
        ),
      ).toEqual(
        summarize(
          commonCohort(base).map((p) => selectReading(p, mode)),
          AS_OF,
        ),
      );
    }
    for (const p of predictions) {
      const b = base.find((b) => b.id === p.id)!;
      expect(p.release).toEqual(b.release);
      expect(p.assessment).toEqual(b.assessment);
    }
  });
  it("labels corroboration limits and uses five distinct primary sources", () => {
    expect(researchSupplement.sources).toHaveLength(5);
    expect(new Set(evidenceSources.map((s) => s.id)).size).toBe(
      evidenceSources.length,
    );
    expect(
      researchSupplement.citations.find(
        (c) => c.record_id === "K007" && c.source_id === "O06",
      )?.limitations,
    ).toContain("not evidence of home-server ownership");
    expect(
      researchSupplement.citations.find(
        (c) => c.record_id === "K005" && c.source_id === "O07",
      )?.limitations,
    ).toContain("does not establish storage technology");
    for (const source of researchSupplement.sources) {
      expect(
        predictions.some((p) =>
          p.evidence.some((e) => e.sourceId === source.id),
        ),
      ).toBe(true);
      expect(source.checked_as_of).toBe("2026-10-18");
    }
  });
  it("separates citation check dates from the assessment cutoff and retains history", () => {
    const p = predictions.find((p) => p.id === "K002")!;
    expect(p.assessment.lastReviewedAt).toBe("2026-10-15");
    expect(p.research.history.at(-1)?.date).toBe("2026-10-18");
    expect(p.research.history.some((h) => h.date === "2026-10-14")).toBe(true);
    expect(p.evidence.find((e) => e.sourceId === "SUP005")?.publishedAt).toBe(
      "2008-10-14",
    );
  });
  it("rejects missing locators rather than inventing them", () => {
    const s = structuredClone(researchSupplement);
    s.citations[0].locator = "";
    expect(() => citationSupplementSchema.parse(s)).toThrow();
    const { release, sources } = loadEvidence();
    const p = adaptEvidence(
      release.records[0],
      sources,
      evidenceFile,
      sha(evidenceFile),
    );
    expect(applyCitationSupplement(p, researchSupplement)).toBe(p);
  });
});
