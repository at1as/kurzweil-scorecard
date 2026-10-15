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
import { summarize } from "@/lib/scoring";
import { categories } from "@/lib/data";
import {
  horizonGroup,
  publicationDecade,
  scorecardUrl,
  targetDecade,
  type Filters,
} from "@/lib/filters";
import { Badge } from "./ui";
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
  const [mode, setMode] = useState<"collection" | "outcomes" | "verdicts">(
    "collection",
  );
  const summary = summarize(records, asOf);
  const groups = useMemo(() => {
    const buckets = new Map<string, Prediction[]>();
    if (group === "category")
      for (const c of categories) buckets.set(c.name, []);
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
      .sort((a, b) => a.label.localeCompare(b.label));
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
            {compact
              ? "A closer look at the reviewed subset"
              : "Compare the collection"}
          </h3>
          <p>
            {records.length} curated records · {summary.eligible} due and
            eligible assessments
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
          {(["collection", "outcomes", "verdicts"] as const).map((value) => (
            <button
              key={value}
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              {value === "collection"
                ? "Collection"
                : value === "outcomes"
                  ? "Due outcomes"
                  : "Verdicts"}
            </button>
          ))}
        </div>
      </div>
      <p className="analysis-note">
        Selected subset only; group sizes are too small for a defensible
        accuracy ranking. Counts are shown instead of category rates.{" "}
        {group === "horizon"
          ? "Horizon requires confirmed publication and deadline years; unresolved years remain open."
          : "Publication years are attributed; approximate target labels are for navigation only."}
      </p>
      <div className="table-scroll">
        <table className="analysis-table">
          <caption className="sr-only">
            Selected subset counts by {GROUP_LABELS[group]}; not an accuracy
            ranking.
          </caption>
          <thead>
            <tr>
              <th scope="col">{GROUP_LABELS[group]}</th>
              {mode === "collection" ? (
                <>
                  <th scope="col">Curated</th>
                  <th scope="col">Assessed</th>
                  <th scope="col">Due & eligible</th>
                  <th scope="col">Unreviewed</th>
                </>
              ) : mode === "outcomes" ? (
                <>
                  <th scope="col">Eligible n</th>
                  <th scope="col">Correct</th>
                  <th scope="col">Partial</th>
                  <th scope="col">Wrong / missed</th>
                  <th scope="col">Current outcome unknown</th>
                </>
              ) : (
                <>
                  <th scope="col">Assessed n</th>
                  <th scope="col">
                    Editorial verdicts (all assessed versions)
                  </th>
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
                {mode === "collection" ? (
                  <>
                    <td>
                      <Link className="collection-bar-cell" href={link(g.key)}>
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
                    <td>{g.stats.unreviewed}</td>
                  </>
                ) : mode === "outcomes" ? (
                  <>
                    <td>
                      <Link href={link(g.key, true)}>{g.stats.eligible}</Link>
                    </td>
                    {(["CORRECT", "PARTIAL", "MISSED"] as const).map((v) => (
                      <td key={v}>
                        <Link
                          href={scorecardUrl({
                            [group]: g.key,
                            cohort: "eligible",
                            verdict: v,
                          })}
                        >
                          {g.stats.eligibleBreakdown[v]}
                        </Link>
                      </td>
                    ))}
                    <td>{g.stats.currentUnknown}</td>
                  </>
                ) : (
                  <>
                    <td>{g.stats.verified}</td>
                    <td>
                      <div className="group-distribution">
                        {(Object.keys(LABELS) as Verdict[])
                          .filter((v) => g.stats.breakdown[v] > 0)
                          .map((v) => (
                            <Link
                              key={v}
                              href={scorecardUrl({
                                [group]: g.key,
                                verdict: v,
                                view: "verified",
                              })}
                            >
                              <Badge verdict={v} />
                              <strong>{g.stats.breakdown[v]}</strong>
                            </Link>
                          ))}
                        {!g.stats.verified && (
                          <span className="muted">No assessed records</span>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="footnote">
        Snapshot {asOf}. Eligibility follows the supplied editorial flags.
        Future, unreviewed, unscorable, and qualified hardware-proxy assessments
        are excluded from the due subset. Partial outcomes receive no fractional
        credit. Unknown current outcomes are not failures.
      </p>
    </div>
  );
}
