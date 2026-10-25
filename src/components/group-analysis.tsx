"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { scorecardUrl, type Filters } from "@/lib/filters";
import {
  BREAKDOWN_GROUPS,
  type BreakdownViews,
  type BreakdownGroup,
} from "@/lib/collection-breakdown";
import {
  OUTCOME_ORDER,
  OUTCOME_LABELS,
  OUTCOME_MARKS,
  PUBLIC_READINGS,
} from "@/lib/publication";
import { useStoryComparison } from "./story-comparison-context";

export function GroupAnalysis({ views }: { views: BreakdownViews }) {
  const { reading } = useStoryComparison();
  const [group, setGroup] = useState<BreakdownGroup>("type");
  const { summary, groups } = views[reading][group];
  const link = (key: string, filters: Partial<Filters> = {}) =>
    scorecardUrl({ [group]: key, ...filters, reading });
  return (
    <div className="group-analysis">
      <div className="analysis-controls">
        <div>
          <h3>Compare the collection</h3>
          <p>
            {summary.total} predictions · {summary.due} with deadlines passed ·{" "}
            {PUBLIC_READINGS[reading]}
          </p>
        </div>
        <label className="inline-select">
          Group by
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value as BreakdownGroup)}
          >
            {Object.entries(BREAKDOWN_GROUPS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="analysis-note">
        {group === "type"
          ? "Capability asks whether a technology exists; adoption asks how widely people use it."
          : group === "publication"
            ? "Publication years follow the current source attribution."
            : group === "target"
              ? "Target decades follow the deadlines in this interpretation."
              : "Each prediction belongs to one field. Groups vary in size."}
      </p>
      <div
        className="table-scroll"
        role="region"
        aria-label="Collection outcome counts"
        tabIndex={0}
      >
        <table className="analysis-table collection-outcomes">
          <caption className="sr-only">
            Outcomes by {BREAKDOWN_GROUPS[group]}, {PUBLIC_READINGS[reading]}.
            Future and undated predictions are excluded from outcome counts.
          </caption>
          <thead>
            <tr>
              <th scope="col">{BREAKDOWN_GROUPS[group]}</th>
              <th scope="col">Due</th>
              {OUTCOME_ORDER.map((v) => (
                <th scope="col" key={v}>
                  <span
                    className={`outcome-${v.toLowerCase()}`}
                    aria-hidden="true"
                  >
                    {OUTCOME_MARKS[v]}
                  </span>{" "}
                  {OUTCOME_LABELS[v]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.key}>
                <th scope="row">
                  {g.total ? (
                    <Link href={link(g.key)}>
                      {g.label}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </Link>
                  ) : (
                    g.label
                  )}
                  {(g.future > 0 || g.undated > 0) && (
                    <small className="group-outside">
                      {g.future > 0 && (
                        <Link href={link(g.key, { view: "future" })}>
                          {g.future} future
                        </Link>
                      )}
                      {g.future > 0 && g.undated > 0 && " · "}
                      {g.undated > 0 && (
                        <Link href={link(g.key, { cohort: "undated" })}>
                          {g.undated} undated
                        </Link>
                      )}
                    </small>
                  )}
                  {!g.total && <small>No records</small>}
                </th>
                <td>
                  {g.due ? (
                    <Link
                      aria-label={`${g.label}: ${g.due} due predictions`}
                      href={link(g.key, { cohort: "eligible" })}
                    >
                      {g.due}
                    </Link>
                  ) : (
                    <span className="muted">0</span>
                  )}
                </td>
                {OUTCOME_ORDER.map((v) => (
                  <td key={v}>
                    {g.outcomes[v] ? (
                      <Link
                        aria-label={`${g.label}: ${g.outcomes[v]} ${OUTCOME_LABELS[v].toLowerCase()}`}
                        href={link(g.key, { cohort: "eligible", verdict: v })}
                      >
                        {g.outcomes[v]}
                      </Link>
                    ) : (
                      <span className="muted">0</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="footnote">
        {summary.future} future and {summary.undated} undated predictions are
        outside the outcome counts. Select a count to explore its predictions in
        the ledger.
      </p>
    </div>
  );
}
