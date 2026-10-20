"use client";
import { useEffect, useState } from "react";
import { CategoryChart } from "./category-chart";
import type { CategoryResult } from "@/lib/publication";
import { PUBLIC_READINGS } from "@/lib/publication";
import { READINGS, type Reading } from "@/lib/evidence-model";
export function CategoryExplorer({
  views,
  commonViews,
}: {
  views: Record<Reading, CategoryResult[]>;
  commonViews: Record<Reading, CategoryResult[]>;
}) {
  const [reading, setReading] = useState<Reading>("reference");
  const [common, setCommon] = useState(false);
  useEffect(() => {
    function readUrl() {
      const params = new URLSearchParams(window.location.search);
      const value = params.get("reading");
      setReading(
        READINGS.includes(value as Reading) ? (value as Reading) : "reference",
      );
      setCommon(params.get("cohort") === "common");
    }
    readUrl();
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  }, []);
  function update(nextReading: Reading, nextCommon: boolean) {
    setReading(nextReading);
    setCommon(nextCommon);
    const url = new URL(window.location.href);
    if (nextReading === "reference") url.searchParams.delete("reading");
    else url.searchParams.set("reading", nextReading);
    if (nextCommon) url.searchParams.set("cohort", "common");
    else url.searchParams.delete("cohort");
    window.history.replaceState(null, "", url);
  }
  const commonCount = commonViews.reference.reduce(
    (sum, row) => sum + row.due,
    0,
  );
  const rows = (common ? commonViews : views)[reading];
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
      <details className="editorial-disclosure">
        <summary>Compare interpretations on the same predictions</summary>
        <p>
          The stricter reading gives one brain-modeling forecast until the end
          of 2026; our reading uses 2025. Exclude it to compare the same{" "}
          {commonCount} predictions in every reading.
        </p>
        <label className="comparison-check">
          <input
            type="checkbox"
            checked={common}
            onChange={(e) => update(reading, e.target.checked)}
          />{" "}
          Use the same {commonCount} predictions
        </label>
        <p>
          Alternative readings can change a deadline, population, mechanism or
          adoption threshold. Each record spells out the differences.
        </p>
      </details>
    </section>
  );
}
