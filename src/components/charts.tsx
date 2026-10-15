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
        Verdict distributions will appear after predictions have been
        independently verified. There are no scored results in this release.
      </EmptyChart>
    );
  const entries = Object.entries(stats.breakdown).filter(
    ([, count]) => count > 0,
  ) as [keyof typeof LABELS, number][];
  return (
    <div className="verdict-chart">
      <p className="chart-caption">
        {stats.verified} verified, canonical forecasts · future outcomes shown
        separately
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
  const stats = summarize(records, asOf);
  if (!stats.drifts.length)
    return (
      <EmptyChart title="When did the future arrive?" compact>
        Timing drift needs a verified deadline and a documented year of full
        realization. Neither is assumed from an imported lead.
      </EmptyChart>
    );
  const max = Math.max(...stats.drifts.map((d) => Math.abs(d.years)), 1);
  return (
    <div className="drift-chart">
      <p className="chart-caption">
        {stats.drifts.length} verified, canonical full realizations ·
        calendar-year difference
      </p>
      <div className="drift-axis">
        <span>Early</span>
        <span>On time</span>
        <span>Late</span>
      </div>
      {stats.drifts.map((d) => (
        <Link href={`/predictions/${d.id}/`} key={d.id} className="drift-row">
          <span>{d.id}</span>
          <span className="drift-track">
            <i
              style={{
                left: d.years >= 0 ? "50%" : `${50 + (d.years / max) * 45}%`,
                width: `${Math.max((Math.abs(d.years) / max) * 45, 1)}%`,
              }}
            />
          </span>
          <strong>{driftLabel(d.years)}</strong>
        </Link>
      ))}
    </div>
  );
}
