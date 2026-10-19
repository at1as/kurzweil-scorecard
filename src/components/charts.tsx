import Link from "next/link";
import { scorecardUrl, type Filters } from "@/lib/filters";
import { EmptyChart, Badge } from "./ui";
import { type Prediction, LABELS } from "@/lib/model";
import { driftLabel, summarize, verdict } from "@/lib/scoring";
export function BarChart({
  items,
  filter,
  total,
  label,
  color = "green",
}: {
  items: { name: string; count: number }[];
  filter: keyof Filters;
  total: number;
  label: string;
  color?: "green" | "sand";
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className={`bar-chart ${color}`} role="group" aria-label={label}>
      {items.map((item) => (
        <Link
          href={scorecardUrl({ [filter]: item.name })}
          key={item.name}
          className="bar-row"
          aria-label={`${item.name}: ${item.count} of ${total} records. Explore these records.`}
        >
          <span className="bar-label">{item.name}</span>
          <span className="bar-track">
            <span style={{ width: `${(item.count / max) * 100}%` }} />
          </span>
          <span className="bar-value">
            {item.count}
            <small>{total ? Math.round((item.count / total) * 100) : 0}%</small>
          </span>
        </Link>
      ))}
    </div>
  );
}
export function VerdictChart({
  records,
  asOf,
}: {
  records: Prediction[];
  asOf: string;
}) {
  const stats = summarize(records, asOf);
  if (!stats.verified)
    return (
      <EmptyChart>
        Verdict distributions will appear after editorial outcome review. There
        are no scored results in this release.
      </EmptyChart>
    );
  const entries = Object.entries(stats.breakdown).filter(
    ([, count]) => count > 0,
  ) as [keyof typeof LABELS, number][];
  return (
    <div className="verdict-chart">
      <p className="chart-caption">
        {stats.verified} editorially assessed forecast versions · future
        outcomes shown separately
      </p>
      <div className="verdict-stack">
        {entries.map(([key, count]) => (
          <Link
            key={key}
            className={`segment segment-${key.toLowerCase()}`}
            style={{ flex: count }}
            href={scorecardUrl({
              verdict: key,
              cohort: "canonical",
              view: "verified",
            })}
            aria-label={`${LABELS[key]}: ${count} predictions`}
          />
        ))}
      </div>
      {entries.map(([key, count]) => (
        <Link
          key={key}
          className="verdict-legend-row"
          href={scorecardUrl({
            verdict: key,
            cohort: "canonical",
            view: "verified",
          })}
        >
          <Badge verdict={key} />
          <strong>{count}</strong>
        </Link>
      ))}
    </div>
  );
}
export function DriftChart({
  records,
  asOf,
}: {
  records: Prediction[];
  asOf: string;
}) {
  const dated = records.filter(
    (p) => p.release?.timing && p.release.timing.kind !== "UNESTABLISHED",
  );
  const series = (kinds: string[], label: string) => (
    <div>
      <h4>{label}</h4>
      {dated
        .filter((p) => kinds.includes(p.release!.timing!.kind))
        .map((p) => (
          <Link
            className="timing-row"
            href={`/predictions/${p.id}/`}
            key={p.id}
          >
            <span className="mono">{p.id}</span>
            <span>{p.release!.timing!.label}</span>
          </Link>
        ))}
    </div>
  );
  return (
    <div className="timing-series">
      <p className="chart-caption">
        {dated.length} timing observations. Known-by years are evidence bounds;
        editorial era bounds are approximate market judgments.
      </p>
      {series(["EXACT_EVENT"], "Dated events & bounded drift")}
      <details>
        <summary>
          Known-by observations (
          {
            dated.filter((p) => p.release!.timing!.kind === "DOCUMENTED_BY")
              .length
          }
          )
        </summary>
        {series(
          ["DOCUMENTED_BY"],
          "Documented by this year; first event unknown",
        )}
      </details>
      {series(["EDITORIAL_ERA_BOUND"], "Approximate editorial era bounds")}
      <p className="footnote">
        Still-unfulfilled records show overdue status on their detail pages. An
        unfinished forecast has no completed delay.
      </p>
    </div>
  );
}
