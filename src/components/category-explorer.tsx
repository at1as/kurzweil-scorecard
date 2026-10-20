"use client";
import { useStoryComparison } from "./story-comparison-context";
import { EvidenceLink } from "./evidence-panel";
import { CategoryChart } from "./category-chart";
import { PUBLIC_READINGS } from "@/lib/publication";
import { READINGS, type Reading } from "@/lib/evidence-model";
export function CategoryExplorer() {
  const { reading, common, update, commonCount, rows } = useStoryComparison();
  const due = rows.reduce((sum, row) => sum + row.due, 0);
  return (
    <section className="domain-explorer" aria-label="Outcomes by field">
      <div className="domain-controls">
        <p>
          <strong>{due} predictions</strong>{" "}
          {common ? "in every reading" : "with deadlines passed"}
        </p>
        <label className="inline-select">
          Interpretation
          <select
            aria-label="Interpretation"
            value={reading}
            onChange={(e) => update(e.target.value as Reading, common)}
          >
            {READINGS.map((r) => (
              <option value={r} key={r}>
                {PUBLIC_READINGS[r]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <CategoryChart rows={rows} reading={reading} common={common} />
      <details className="editorial-disclosure comparison-setting">
        <summary>Which predictions are counted?</summary>
        <label className="comparison-check">
          <input
            type="checkbox"
            checked={common}
            aria-describedby="comparison-setting-help"
            onChange={(e) => update(reading, e.target.checked)}
          />
          Keep the same {commonCount} predictions
        </label>
        <dl id="comparison-setting-help" className="comparison-setting-help">
          <div>
            <dt>On</dt>
            <dd>
              Switch interpretations to compare different judgments of the same{" "}
              {commonCount} predictions.
            </dd>
          </div>
          <div>
            <dt>Off</dt>
            <dd>
              Each interpretation counts the predictions whose deadlines have
              passed. The number of predictions can change.
            </dd>
          </div>
        </dl>
        <p className="comparison-setting-detail">
          The difference is{" "}
          <EvidenceLink predictionId="K036" reading={reading}>
            one brain-modeling forecast
          </EvidenceLink>
          : our reading gives it a 2025 deadline; the stricter reading allows
          until the end of 2026, so it is not yet due in this snapshot.
        </p>
      </details>
    </section>
  );
}
