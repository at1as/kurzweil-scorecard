"use client";
import { useStoryComparison } from "./story-comparison-context";
import { CategoryChart } from "./category-chart";
import { ReadingSegmented } from "./reading-segmented";

export function CategoryExplorer() {
  const { reading, update, rows } = useStoryComparison();
  const due = rows.reduce((sum, row) => sum + row.due, 0);
  return (
    <section className="domain-explorer" aria-label="Outcomes by field">
      <div className="domain-controls">
        <p>
          <strong>
            {due} {due === 1 ? "prediction" : "predictions"}
          </strong>{" "}
          with deadlines passed
        </p>
        <ReadingSegmented
          value={reading}
          onChange={update}
          ariaLabel="Interpretation"
        />
      </div>
      <CategoryChart rows={rows} reading={reading} />
    </section>
  );
}
