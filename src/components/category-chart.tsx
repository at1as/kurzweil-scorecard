import Link from "next/link";
import type { Reading } from "@/lib/evidence-model";
import { scorecardUrl } from "@/lib/filters";
import {
  type CategoryResult,
  OUTCOME_LABELS,
  OUTCOME_MARKS,
  OUTCOME_ORDER,
} from "@/lib/publication";

export function OutcomeLegend() {
  return (
    <div className="outcome-legend" aria-label="Outcome key">
      {OUTCOME_ORDER.map((v) => (
        <span key={v}>
          <i
            className={`forecast-dot dot-${v.toLowerCase()}`}
            aria-hidden="true"
          >
            {OUTCOME_MARKS[v]}
          </i>
          {OUTCOME_LABELS[v]}
        </span>
      ))}
    </div>
  );
}
export function CategoryChart({
  rows,
  reading = "reference",
  common = false,
}: {
  rows: CategoryResult[];
  reading?: Reading;
  common?: boolean;
}) {
  return (
    <div className="category-chart">
      <OutcomeLegend />
      <p className="chart-instruction">
        Each square is one prediction. Select it to read the evidence.
      </p>
      <div className="category-chart-head" aria-hidden="true">
        <span>Field</span>
        <span>Predictions with deadlines passed</span>
        <span>Fully realized</span>
      </div>
      <ul className="category-rows">
        {rows.map((row) => (
          <li
            key={row.name}
            className={`category-result ${!row.due ? "no-due" : ""}`}
          >
            <Link
              className="category-name"
              href={scorecardUrl({
                category: row.name,
                reading,
                ...(row.due ? { cohort: common ? "common" : "eligible" } : {}),
              })}
            >
              {row.name}
              <small>
                {row.due
                  ? `${row.due} assessed${row.due < 4 ? " · small sample" : ""}`
                  : `${row.total} collected · none due`}
              </small>
            </Link>
            <div className="forecast-dots">
              {row.records.map((p) => {
                const v = p.verdict as (typeof OUTCOME_ORDER)[number];
                return (
                  <Link
                    key={p.id}
                    className={`forecast-dot dot-${v.toLowerCase()}`}
                    href={`/predictions/${p.id}/${reading === "reference" ? "" : `?reading=${reading}`}`}
                    title={`${p.id} · ${p.claim} — ${OUTCOME_LABELS[v]}`}
                    aria-label={`${p.id}: ${p.claim} — ${OUTCOME_LABELS[v]}`}
                  >
                    <span aria-hidden="true">{OUTCOME_MARKS[v]}</span>
                  </Link>
                );
              })}
              {!row.due && (
                <span className="empty-domain">
                  {row.total ? "Waiting for deadlines" : "No records yet"}
                </span>
              )}
            </div>
            <div className="category-ratio">
              {row.due ? (
                <>
                  <strong>
                    {row.realized}
                    <span> / {row.due}</span>
                  </strong>
                  <small>{row.onTime} on time</small>
                </>
              ) : (
                <span>—</span>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="chart-footnote">
        Fully realized = on time + late. Partial gets no fractional credit.
        Counts describe this selected collection; the fields have different
        sample sizes and deadlines.
      </p>
    </div>
  );
}
