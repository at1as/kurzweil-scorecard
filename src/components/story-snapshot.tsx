"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Reading } from "@/lib/evidence-model";
import {
  OUTCOME_LABELS,
  OUTCOME_MARKS,
  OUTCOME_ORDER,
  type ScoredOutcome,
} from "@/lib/publication";
import { scorecardUrl } from "@/lib/filters";
import type { SnapshotCounts } from "@/lib/ledger-data";
import { ReadingSegmented } from "./reading-segmented";
import { useStoryComparison } from "./story-comparison-context";

const TIER_DESCRIPTIONS: Record<Reading, string> = {
  strict:
    "Literal holds Kurzweil closely to his stated mechanism, form factor, and adoption bar.",
  reference:
    "Balanced is our default reading—fair to the context, without letting prototypes count as mass adoption.",
  broader:
    "Charitable credits reasonable functional substitutes, without rewriting failed claims.",
};

const OUTCOME_NOTES: Record<
  ScoredOutcome,
  { description: string; example: string }
> = {
  CORRECT: {
    description: "Arrived by the deadline.",
    example: "Wireless peripherals",
  },
  LATE: {
    description: "Came true, behind schedule.",
    example: "Brain-scale supercomputing",
  },
  PARTIAL: {
    description: "Partly fulfilled so far.",
    example: "Robots in every home",
  },
  MISSED: {
    description: "Still unfulfilled today.",
    example: "Life expectancy over 100",
  },
};

export function StorySnapshot({
  summaries,
  upcomingCount,
  undatedCount,
}: {
  summaries: Record<Reading, SnapshotCounts>;
  upcomingCount: number;
  undatedCount: number;
}) {
  const { reading, update } = useStoryComparison();
  const active = summaries[reading];
  const onTimePct = Math.round((active.onTime / active.due) * 100);
  const realizedPct = Math.round((active.realized / active.due) * 100);

  return (
    <section
      id="state"
      className="story-snapshot"
      aria-labelledby="snapshot-title"
    >
      <div className="snapshot-header">
        <div className="snapshot-title">
          <div>
            <h2 id="snapshot-title">How the predictions turned out</h2>
            <p className="snapshot-subline">
              {active.due} predictions past their deadline ·{" "}
              <strong>{onTimePct}% on time</strong>,{" "}
              <strong>{realizedPct}% eventually realized</strong>
            </p>
          </div>
          <ReadingSegmented
            value={reading}
            onChange={update}
            ariaLabel="Interpretation reading"
          />
        </div>
        <p className="snapshot-tier-note">{TIER_DESCRIPTIONS[reading]}</p>
      </div>
      <div className="outcome-summary">
        {OUTCOME_ORDER.map((v) => {
          const count = active.counts[v];
          const share = Math.round((count / active.due) * 100);
          return (
            <Link
              prefetch={false}
              key={v}
              className={`summary-outcome summary-${v.toLowerCase()}`}
              href={scorecardUrl({ cohort: "eligible", verdict: v, reading })}
            >
              <div className="summary-count">
                <strong>{count}</strong>
                <span className="summary-share">
                  {share}% <i aria-hidden="true">{OUTCOME_MARKS[v]}</i>
                </span>
              </div>
              <h3>
                {OUTCOME_LABELS[v]}
                <ArrowUpRight size={17} aria-hidden="true" />
              </h3>
              <p>{OUTCOME_NOTES[v].description}</p>
              <small>e.g. {OUTCOME_NOTES[v].example}</small>
            </Link>
          );
        })}
      </div>
      <p className="scope-caption">
        {upcomingCount} upcoming predictions (2026–2045) and {undatedCount}{" "}
        undated claims sit outside these counts.{" "}
        <Link prefetch={false} href="/methodology/">
          How we score them →
        </Link>
      </p>
    </section>
  );
}
