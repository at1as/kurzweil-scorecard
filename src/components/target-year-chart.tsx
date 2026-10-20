"use client";
import { useId, useRef, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { READINGS, type Reading } from "@/lib/evidence-model";
import {
  OUTCOME_LABELS,
  OUTCOME_MARKS,
  OUTCOME_ORDER,
  PUBLIC_READINGS,
  targetYearResults,
  type ScoredOutcome,
} from "@/lib/publication";
import { useStoryComparison } from "./story-comparison-context";
import { OutcomeLegend } from "./category-chart";
import { EvidenceLink } from "./evidence-panel";

export function TargetYearChart({ asOfLabel }: { asOfLabel: string }) {
  const { rows, reading, update } = useStoryComparison();
  const groups = targetYearResults(rows);
  const total = groups.reduce((sum, g) => sum + g.records.length, 0);
  const largest = [...groups]
    .sort((a, b) => b.records.length - a.records.length)
    .slice(0, 2);
  const [metric, setMetric] = useState<"count" | "share">("count");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const selected = groups.find((g) => g.year === selectedYear);
  const buttons = useRef(new Map<number, HTMLButtonElement>());
  const prefix = useId();
  const maximum = Math.max(
    10,
    Math.ceil(Math.max(...groups.map((g) => g.records.length), 0) / 10) * 10,
  );
  const ceiling = metric === "share" ? 100 : maximum;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  function close() {
    setSelectedYear(null);
    if (selectedYear !== null) buttons.current.get(selectedYear)?.focus();
  }
  return (
    <section
      id="by-target-year"
      className="story-section target-year-section"
      aria-labelledby={`${prefix}-heading`}
    >
      <div className="story-section-heading">
        <h2 id={`${prefix}-heading`}>How the target years compare</h2>
        {largest.length === 2 && (
          <p>
            The two largest groups target {largest[0].year} and{" "}
            {largest[1].year}:{" "}
            {largest[0].records.length + largest[1].records.length} of these{" "}
            {total} forecasts. Each column shows the outcomes for one target
            year, assessed through {asOfLabel}.
          </p>
        )}
      </div>
      <div className="time-controls">
        <div
          className="segmented"
          role="group"
          aria-label="Target-year chart scale"
        >
          <button
            type="button"
            aria-pressed={metric === "count"}
            onClick={() => setMetric("count")}
          >
            Number of predictions
          </button>
          <button
            type="button"
            aria-pressed={metric === "share"}
            onClick={() => setMetric("share")}
          >
            Share of each group
          </button>
        </div>
        <label className="inline-select">
          Interpretation
          <select
            aria-label="Target-year interpretation"
            value={reading}
            onChange={(e) => update(e.target.value as Reading)}
          >
            {READINGS.map((r) => (
              <option key={r} value={r}>
                {PUBLIC_READINGS[r]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <OutcomeLegend />
      <p className="chart-instruction">
        Select a year to see its predictions. {total} predictions with deadlines
        passed.
      </p>
      <div
        className="time-plot"
        role="group"
        aria-label="Forecast outcomes by target year"
      >
        <div className="time-axis-title">
          {metric === "count"
            ? "Predictions"
            : "% of predictions in each group"}
        </div>
        <div className="time-chart-body">
          <div className="time-grid" aria-hidden="true">
            {ticks.map((fraction) => (
              <div
                className="time-grid-line"
                key={fraction}
                style={{ bottom: `${fraction * 100}%` }}
              >
                <span>
                  {ceiling * fraction}
                  {metric === "share" ? "%" : ""}
                </span>
              </div>
            ))}
          </div>
          <div
            className="time-columns"
            style={{
              gridTemplateColumns: `repeat(${Math.max(groups.length, 1)}, minmax(0, 1fr))`,
            }}
          >
            {groups.map((group) => {
              const n = group.records.length;
              const open = selected?.year === group.year;
              const description = OUTCOME_ORDER.map(
                (v) => `${group.counts[v]} ${OUTCOME_LABELS[v].toLowerCase()}`,
              ).join(", ");
              return (
                <button
                  type="button"
                  key={group.year}
                  ref={(element) => {
                    if (element) buttons.current.set(group.year, element);
                    else buttons.current.delete(group.year);
                  }}
                  className="time-year"
                  aria-label={`${group.year}: ${n} predictions; ${description}`}
                  aria-expanded={open}
                  aria-controls={`${prefix}-records`}
                  title={`${group.year} · ${n} predictions\n${description}`}
                  onClick={() => setSelectedYear(open ? null : group.year)}
                >
                  <span className="time-column" aria-hidden="true">
                    <span
                      className="time-stack"
                      style={{
                        height: `${metric === "share" ? 100 : (n / maximum) * 100}%`,
                      }}
                    >
                      {OUTCOME_ORDER.filter((v) => group.counts[v] > 0).map(
                        (v) => {
                          const count = group.counts[v];
                          const size =
                            metric === "share" ? count / n : count / maximum;
                          return (
                            <span
                              key={v}
                              className={`time-segment time-${v.toLowerCase()}`}
                              style={{ flex: count }}
                            >
                              {size >= 0.09 && (
                                <span>
                                  <i>{OUTCOME_MARKS[v]}</i>{" "}
                                  {metric === "count"
                                    ? count
                                    : `${Math.round((count / n) * 100)}%`}
                                </span>
                              )}
                            </span>
                          );
                        },
                      )}
                    </span>
                  </span>
                  <span className="time-year-label" aria-hidden="true">
                    <ChevronRight size={13} />
                    {group.year}
                  </span>
                  <span className="time-sample" aria-hidden="true">
                    n = {n}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="time-x-label">Target year · one column per group</p>
      </div>
      <p className="chart-footnote time-footnote">
        Older targets have had longer to catch up, and each group contains
        different claims. Only due forecasts are shown; year columns are equally
        spaced.
      </p>
      <div id={`${prefix}-records`} hidden={!selected} className="time-details">
        {selected && (
          <>
            <div className="time-detail-heading">
              <h3>
                {selected.year} forecasts{" "}
                <span>· {selected.records.length} predictions</span>
              </h3>
              <button
                className="time-close"
                type="button"
                aria-label="Close target-year predictions"
                onClick={close}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="time-counts">
              {OUTCOME_ORDER.map((v) => (
                <span key={v}>
                  <i aria-hidden="true">{OUTCOME_MARKS[v]}</i>{" "}
                  {OUTCOME_LABELS[v]} <strong>{selected.counts[v]}</strong>
                  <small>
                    {(
                      (selected.counts[v] / selected.records.length) *
                      100
                    ).toFixed(1)}
                    %
                  </small>
                </span>
              ))}
            </div>
            <div
              className="time-record-scroll"
              role="region"
              aria-label={`${selected.year} prediction list`}
              tabIndex={0}
            >
              <table className="field-predictions time-records">
                <caption className="sr-only">
                  Predictions targeting {selected.year},{" "}
                  {PUBLIC_READINGS[reading]}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Prediction</th>
                    <th scope="col">Judgment</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.records.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <EvidenceLink
                          predictionId={record.id}
                          reading={reading}
                        >
                          <span className="field-record-id">{record.id}</span>
                          {record.claim}
                        </EvidenceLink>
                      </td>
                      <td>
                        <span
                          className={`field-outcome outcome-${record.verdict.toLowerCase()}`}
                        >
                          <i aria-hidden="true">
                            {OUTCOME_MARKS[record.verdict as ScoredOutcome]}
                          </i>
                          {OUTCOME_LABELS[record.verdict as ScoredOutcome]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
