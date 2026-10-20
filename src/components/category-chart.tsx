"use client";
import Link from "next/link";
import { EvidenceLink } from "./evidence-panel";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import type { Reading } from "@/lib/evidence-model";
import { scorecardUrl } from "@/lib/filters";
import {
  type CategoryResult,
  type ForecastSummary,
  OUTCOME_LABELS,
  OUTCOME_MARKS,
  OUTCOME_ORDER,
} from "@/lib/publication";

type Outcome = (typeof OUTCOME_ORDER)[number];
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
}: {
  rows: CategoryResult[];
  reading?: Reading;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    record: ForecastSummary;
    rect: DOMRect;
  } | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const tooltip = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefix = useId();
  const tooltipId = `${prefix}-preview`;
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }
  function hideSoon() {
    cancelClose();
    closeTimer.current = setTimeout(() => setPreview(null), 120);
  }
  function show(record: ForecastSummary, element: HTMLElement) {
    cancelClose();
    setPreview({ record, rect: element.getBoundingClientRect() });
  }
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!preview) return;
    const close = () => setPreview(null);
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", key);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [preview]);
  useLayoutEffect(() => {
    if (!preview || !tooltip.current) return;
    const { width, height } = tooltip.current.getBoundingClientRect();
    const { rect } = preview;
    setPosition({
      left: Math.max(
        12,
        Math.min(
          rect.left + rect.width / 2 - width / 2,
          window.innerWidth - width - 12,
        ),
      ),
      top: rect.top > height + 20 ? rect.top - height - 10 : rect.bottom + 10,
    });
  }, [preview]);
  // A different reading must not leave a preview showing the previous judgment.
  useEffect(() => setPreview(null), [reading]);

  return (
    <div className="category-chart">
      <OutcomeLegend />
      <p className="chart-instruction">
        Open a field to see its predictions. Hover a square for the claim;
        select it for the evidence.
      </p>
      <div className="category-chart-head" aria-hidden="true">
        <span>Field</span>
        <span>Predictions with deadlines passed</span>
        <span>Fully realized</span>
      </div>
      <ul className="category-rows">
        {rows.map((row, index) => {
          const open = expanded === row.name;
          const canOpen = row.total > 0;
          const panelId = `${prefix}-field-${index}`;
          const name = (
            <span>
              {row.name}
              <small>
                {row.due
                  ? `${row.due} assessed${row.due < 4 ? " · small sample" : ""}`
                  : row.total
                    ? `${row.total} collected · none due`
                    : "No records yet"}
              </small>
            </span>
          );
          return (
            <li
              key={row.name}
              className={`category-result ${!row.due ? "no-due" : ""} ${open ? "is-expanded" : ""}`}
            >
              <div className="category-row-header">
                {canOpen ? (
                  <button
                    className="category-name"
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    aria-label={`${row.name} predictions`}
                    onClick={() => {
                      setExpanded(open ? null : row.name);
                      setPreview(null);
                    }}
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                    {name}
                  </button>
                ) : (
                  <div className="category-name category-empty">{name}</div>
                )}
                <div className="forecast-dots">
                  {row.records.map((p) => {
                    const v = p.verdict as Outcome;
                    return (
                      <EvidenceLink
                        key={p.id}
                        className={`forecast-dot dot-${v.toLowerCase()}`}
                        predictionId={p.id}
                        reading={reading}
                        aria-label={`${p.id}: ${p.claim} — ${OUTCOME_LABELS[v]}`}
                        aria-describedby={
                          preview?.record.id === p.id ? tooltipId : undefined
                        }
                        onMouseEnter={(e) => show(p, e.currentTarget)}
                        onMouseLeave={hideSoon}
                        onFocus={(e) => show(p, e.currentTarget)}
                        onBlur={() => setPreview(null)}
                        onClick={() => setPreview(null)}
                      >
                        <span aria-hidden="true">{OUTCOME_MARKS[v]}</span>
                      </EvidenceLink>
                    );
                  })}
                  {!row.due && (
                    <span className="empty-domain">
                      {row.total ? "Waiting for deadlines" : "—"}
                    </span>
                  )}
                </div>
                <div className="category-ratio">
                  {row.due ? (
                    <>
                      <div className="category-realized">
                        <strong>
                          {row.realized}
                          <span> / {row.due}</span>
                        </strong>
                        <span className="category-rate">
                          {((row.realized / row.due) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <small>
                        {row.onTime} on time{" "}
                        <span className="category-rate">
                          {((row.onTime / row.due) * 100).toFixed(1)}%
                        </span>
                      </small>
                    </>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>
              {canOpen && (
                <div id={panelId} className="category-expanded" hidden={!open}>
                  <table className="field-predictions">
                    <caption className="sr-only">
                      {row.name} predictions — {reading} reading
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Prediction</th>
                        <th scope="col">Target</th>
                        <th scope="col">Judgment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...row.records, ...row.otherRecords].map((p, i) => (
                        <tr
                          key={p.id}
                          className={
                            p.outsideComparison
                              ? `outside-comparison ${i === row.records.length ? "first-outside" : ""}`
                              : ""
                          }
                        >
                          <td>
                            <EvidenceLink predictionId={p.id} reading={reading}>
                              <span className="field-record-id">{p.id}</span>
                              {p.claim}
                            </EvidenceLink>
                          </td>
                          <td>{p.target}</td>
                          <td>
                            {p.outsideComparison ? (
                              <span className="unscored-label">
                                {p.outsideComparison}
                                <small>Not counted</small>
                              </span>
                            ) : (
                              <span
                                className={`field-outcome outcome-${p.verdict.toLowerCase()}`}
                              >
                                <i aria-hidden="true">
                                  {OUTCOME_MARKS[p.verdict as Outcome]}
                                </i>
                                {OUTCOME_LABELS[p.verdict as Outcome]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="field-table-footer">
                    <Link
                      className="text-link"
                      href={scorecardUrl({
                        category: row.name,
                        reading,
                        ...(row.due ? { cohort: "eligible" } : {}),
                      })}
                    >
                      Open in the prediction ledger <ArrowUpRight size={14} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setExpanded(null);
                        document
                          .querySelector<HTMLButtonElement>(
                            `button[aria-controls="${panelId}"]`,
                          )
                          ?.focus();
                      }}
                    >
                      Collapse field ↑
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="chart-footnote">
        Fully realized = on time + late. Partial gets no fractional credit. Both
        percentages use the assessed predictions in that field. Sample sizes and
        deadlines differ between fields.
      </p>
      {preview &&
        createPortal(
          <div
            ref={tooltip}
            id={tooltipId}
            role="tooltip"
            className="forecast-preview"
            style={position}
            onMouseEnter={cancelClose}
            onMouseLeave={hideSoon}
          >
            <span
              className={`preview-meta outcome-${preview.record.verdict.toLowerCase()}`}
            >
              {OUTCOME_LABELS[preview.record.verdict as Outcome]} · Target{" "}
              {preview.record.target}
            </span>
            <strong>{preview.record.claim}</strong>
            <small>
              {preview.record.id} · Select the square to read the evidence ↗
            </small>
          </div>,
          document.body,
        )}
    </div>
  );
}
