"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  type Prediction,
  TYPE_LABELS,
  LABELS,
  type Verdict,
} from "@/lib/model";
import { summarize, rate, driftLabel } from "@/lib/scoring";
import {
  horizonGroup,
  publicationDecade,
  scorecardUrl,
  targetDecade,
  type Filters,
} from "@/lib/filters";
import { EmptyChart, Badge } from "./ui";
type Group = "category" | "target" | "publication" | "horizon" | "type";
const GROUP_LABELS: Record<Group, string> = {
  category: "Primary category",
  target: "Target decade",
  publication: "Publication decade",
  horizon: "Forecast horizon",
  type: "Prediction type",
};
export function GroupAnalysis({
  records,
  asOf,
  initialGroup = "category",
  compact = false,
}: {
  records: Prediction[];
  asOf: string;
  initialGroup?: Group;
  compact?: boolean;
}) {
  const [group, setGroup] = useState<Group>(initialGroup);
  const [mode, setMode] = useState<"collection" | "accuracy" | "verdicts">(
    "collection",
  );
  const summary = summarize(records, asOf);
  const groups = useMemo(() => {
    const buckets = new Map<string, Prediction[]>();
    for (const p of records) {
      const key =
        group === "category"
          ? p.category
          : group === "target"
            ? targetDecade(p)
            : group === "publication"
              ? publicationDecade(p)
              : group === "horizon"
                ? horizonGroup(p)
                : p.claimType;
      buckets.set(key, [...(buckets.get(key) ?? []), p]);
    }
    return [...buckets]
      .map(([key, rows]) => ({
        key,
        label:
          group === "type" ? TYPE_LABELS[key as keyof typeof TYPE_LABELS] : key,
        stats: summarize(rows, asOf),
      }))
      .sort((a, b) =>
        group === "category"
          ? b.stats.collected - a.stats.collected
          : a.label.localeCompare(b.label),
      );
  }, [records, group, asOf]);
  const max = Math.max(...groups.map((g) => g.stats.collected), 1);
  const link = (key: string, eligible = false) =>
    scorecardUrl({
      [group]: key,
      ...(eligible ? { cohort: "eligible" } : {}),
    } as Partial<Filters>);
  return (
    <div
      className={compact ? "group-analysis compact-analysis" : "group-analysis"}
    >
      <div className="analysis-controls">
        <div>
          <h3>
            {compact ? "A closer look at accuracy" : "Compare the collection"}
          </h3>
          <p>
            {records.length} candidate records · {summary.eligible} eligible for
            deadline-based accuracy
          </p>
        </div>
        <label className="inline-select">
          Group by
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value as Group)}
          >
            {Object.entries(GROUP_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="segmented" aria-label="Comparison metric">
          <button
            aria-pressed={mode === "collection"}
            onClick={() => setMode("collection")}
          >
            Collection
          </button>
          <button
            aria-pressed={mode === "accuracy"}
            onClick={() => setMode("accuracy")}
          >
            Accuracy
          </button>
          <button
            aria-pressed={mode === "verdicts"}
            onClick={() => setMode("verdicts")}
          >
            Verdicts
          </button>
        </div>
      </div>
      <p className="analysis-note">
        {group === "horizon"
          ? "Horizon uses confirmed publication and deadline years only. Unconfirmed dates remain unresolved."
          : group === "type"
            ? "Claim types are assigned during review. An unclassified lead is not assumed to be a capability forecast."
            : "Collection groups may use draft categories and unconfirmed date labels. Accuracy uses only verified, due, scorable, deduplicated forecasts."}
      </p>
      {(mode === "accuracy" && summary.eligible === 0) ||
      (mode === "verdicts" && summary.verified === 0) ? (
        <EmptyChart
          title={
            mode === "verdicts"
              ? "No verified verdicts yet."
              : "No eligible forecasts yet."
          }
          compact
        >
          {mode === "verdicts" ? "Verdict distributions" : "Accuracy"} by{" "}
          {GROUP_LABELS[group].toLowerCase()} will become available after the
          required source and outcome review. Unreviewed records contribute no
          hits or misses.
        </EmptyChart>
      ) : (
        <div className="table-scroll">
          <table className="analysis-table">
            <caption className="sr-only">
              Comparison by {GROUP_LABELS[group]}. Every rate includes the same
              eligible denominator.
            </caption>
            <thead>
              <tr>
                <th scope="col">{GROUP_LABELS[group]}</th>
                {mode === "verdicts" ? (
                  <>
                    <th scope="col">Verified n</th>
                    <th scope="col">
                      Distribution of verified canonical forecasts
                    </th>
                  </>
                ) : mode === "collection" ? (
                  <>
                    <th scope="col">Candidates</th>
                    <th scope="col">Verified</th>
                    <th scope="col">Due & eligible</th>
                    <th scope="col">On time</th>
                  </>
                ) : (
                  <>
                    <th scope="col">Eligible n</th>
                    <th scope="col">Strict on time</th>
                    <th scope="col">Full realization</th>
                    <th scope="col">Partial / missed</th>
                    <th scope="col">Mean drift</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.key}>
                  <th scope="row">
                    <Link href={link(g.key)}>
                      {g.label}
                      <ArrowUpRight size={14} />
                    </Link>
                  </th>
                  {mode === "verdicts" ? (
                    <>
                      <td>{g.stats.verified}</td>
                      <td>
                        <div className="group-distribution">
                          {(
                            [
                              "CORRECT",
                              "LATE",
                              "PARTIAL",
                              "MISSED",
                              "PENDING",
                              "UNSCORABLE",
                            ] as Verdict[]
                          )
                            .filter((v) => g.stats.breakdown[v] > 0)
                            .map((v) => (
                              <Link
                                key={v}
                                href={scorecardUrl({
                                  [group]: g.key,
                                  verdict: v,
                                  view: "verified",
                                  cohort: "canonical",
                                })}
                                aria-label={`${g.label}: ${g.stats.breakdown[v]} ${LABELS[v]} of ${g.stats.verified} verified forecasts`}
                              >
                                <Badge verdict={v} />
                                <strong>{g.stats.breakdown[v]}</strong>
                              </Link>
                            ))}
                          {g.stats.verified === 0 && (
                            <span className="muted">No verified sample</span>
                          )}
                        </div>
                      </td>
                    </>
                  ) : mode === "collection" ? (
                    <>
                      <td>
                        <Link
                          className="collection-bar-cell"
                          href={link(g.key)}
                        >
                          <span className="mini-bar">
                            <i
                              style={{
                                width: `${(g.stats.collected / max) * 100}%`,
                              }}
                            />
                          </span>
                          <strong>{g.stats.collected}</strong>
                        </Link>
                      </td>
                      <td>{g.stats.verified}</td>
                      <td>
                        <Link href={link(g.key, true)}>{g.stats.eligible}</Link>
                      </td>
                      <td>
                        <span className="muted">
                          {rate(g.stats.onTimeRate)}
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <Link href={link(g.key, true)}>{g.stats.eligible}</Link>
                      </td>
                      <td>
                        <Link href={link(g.key, true)}>
                          <span className="rate-mark">
                            <span className="mini-bar" aria-hidden="true">
                              <i
                                style={{
                                  width: `${(g.stats.onTimeRate ?? 0) * 100}%`,
                                }}
                              />
                            </span>
                            {rate(g.stats.onTimeRate)}
                          </span>
                          <small>
                            {g.stats.onTime} / {g.stats.eligible}
                          </small>
                        </Link>
                      </td>
                      <td>
                        <Link href={link(g.key, true)}>
                          <span className="rate-mark">
                            <span className="mini-bar" aria-hidden="true">
                              <i
                                style={{
                                  width: `${(g.stats.realizationRate ?? 0) * 100}%`,
                                }}
                              />
                            </span>
                            {rate(g.stats.realizationRate)}
                          </span>
                          <small>
                            {g.stats.realized} / {g.stats.eligible}
                          </small>
                        </Link>
                      </td>
                      <td>
                        {g.stats.breakdown.PARTIAL} / {g.stats.breakdown.MISSED}
                      </td>
                      <td>
                        <Link
                          href={scorecardUrl({
                            [group]: g.key,
                            cohort: "drift",
                          })}
                        >
                          {driftLabel(
                            g.stats.meanDrift === null
                              ? null
                              : Math.round(g.stats.meanDrift * 10) / 10,
                          )}
                          <small>n = {g.stats.drifts.length}</small>
                        </Link>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="footnote">
        Snapshot {asOf}. Future deadlines are excluded from both accuracy rates,
        including early successes. Partial outcomes receive no fractional
        credit. Drift covers verified full realizations with established years.
        Verdict distributions use all verified canonical forecasts, including
        future and unscorable records.
      </p>
    </div>
  );
}
