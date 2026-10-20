"use client";
import { useStoryComparison } from "./story-comparison-context";
import { CategoryChart } from "./category-chart";
import { PUBLIC_READINGS } from "@/lib/publication";
import { READINGS, type Reading } from "@/lib/evidence-model";
export function CategoryExplorer() {
  const { reading, update, rows } = useStoryComparison();
  const due = rows.reduce((sum, row) => sum + row.due, 0);
  return (
    <section className="domain-explorer" aria-label="Outcomes by field">
      <div className="domain-controls">
        <p>
          <strong>{due} predictions</strong> with deadlines passed
        </p>
        <label className="inline-select">
          Interpretation
          <select
            aria-label="Interpretation"
            value={reading}
            onChange={(e) => update(e.target.value as Reading)}
          >
            {READINGS.map((r) => (
              <option value={r} key={r}>
                {PUBLIC_READINGS[r]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <CategoryChart rows={rows} reading={reading} />
    </section>
  );
}
