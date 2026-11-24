"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  OUTCOME_LABELS,
  OUTCOME_ORDER,
  PUBLIC_READINGS,
} from "@/lib/publication";
import { scorecardUrl } from "@/lib/filters";
import type { CapabilitySplitViews, TypeSplit } from "@/lib/ledger-data";
import { useStoryComparison } from "./story-comparison-context";
import { EvidenceLink } from "./evidence-panel";
import { Eyebrow } from "./ui";

const CAPABILITY_EXAMPLES = [
  { id: "K002", label: "Thin laptops" },
  { id: "K013", label: "E-paper displays" },
  { id: "K033", label: "20-petaflop supercomputers" },
];

const ADOPTION_EXAMPLES = [
  { id: "K011", label: "Dictation for most text" },
  { id: "K080", label: "Robots in every home" },
  { id: "K078", label: "AI tutors for most learning" },
];

function SplitCard({
  title,
  subtitle,
  split,
  typeKey,
  examples,
}: {
  title: string;
  subtitle: string;
  split: TypeSplit;
  typeKey: "CAPABILITY" | "ADOPTION";
  examples: { id: string; label: string }[];
}) {
  const { reading } = useStoryComparison();
  const realizedPct = Math.round((split.realized / split.due) * 100);
  const onTimePct = Math.round((split.onTime / split.due) * 100);

  return (
    <article className="thesis-card">
      <div className="thesis-card-head">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="thesis-stat">
          <strong>{realizedPct}%</strong>
          <span>realized</span>
        </div>
      </div>
      <div className="thesis-substat">
        <span>
          <strong>
            {split.realized} of {split.due}
          </strong>{" "}
          came true ({split.onTime} on time, {onTimePct}%)
        </span>
      </div>
      <div
        className="thesis-bar"
        role="img"
        aria-label={`${title}: ${OUTCOME_ORDER.map((v) => `${split.counts[v]} ${OUTCOME_LABELS[v].toLowerCase()}`).join(", ")}`}
      >
        {OUTCOME_ORDER.filter((v) => split.counts[v] > 0).map((v) => (
          <span
            key={v}
            className={`thesis-bar-seg time-${v.toLowerCase()}`}
            style={{ flex: split.counts[v] }}
            title={`${OUTCOME_LABELS[v]}: ${split.counts[v]}`}
          />
        ))}
      </div>
      <div className="thesis-counts">
        {OUTCOME_ORDER.map((v) => (
          <span key={v}>
            <i className={`thesis-swatch time-${v.toLowerCase()}`} />
            {OUTCOME_LABELS[v]} <strong>{split.counts[v]}</strong>
          </span>
        ))}
      </div>
      <div className="thesis-examples">
        <span className="micro-label">Examples</span>
        <div>
          {examples.map((ex) => (
            <EvidenceLink key={ex.id} predictionId={ex.id} reading={reading}>
              {ex.label}
            </EvidenceLink>
          ))}
        </div>
      </div>
      <Link
        prefetch={false}
        className="text-link thesis-link"
        href={scorecardUrl({ type: typeKey, cohort: "eligible", reading })}
      >
        Explore all {split.due} {title.toLowerCase()} predictions{" "}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </article>
  );
}

export function CapabilityAdoption({
  splits,
}: {
  splits: CapabilitySplitViews;
}) {
  const { reading } = useStoryComparison();
  const current = splits[reading];

  return (
    <section
      id="capability-vs-adoption"
      className="story-section thesis-section"
      aria-labelledby="thesis-heading"
    >
      <div className="story-section-heading">
        <Eyebrow>THE PATTERN · {PUBLIC_READINGS[reading]}</Eyebrow>
        <h2 id="thesis-heading">
          Exponential hardware, stubborn human habits
        </h2>
        <p>
          That is the core split in Kurzweil’s record. He is sharp at
          extrapolating what technology will be capable of on an exponential
          curve, and consistently too optimistic about how quickly human habits,
          regulation, and everyday preferences change.
        </p>
      </div>
      <div className="thesis-grid">
        <SplitCard
          title="Technical capability"
          subtitle="Can the technology do what he predicted?"
          split={current.capability}
          typeKey="CAPABILITY"
          examples={CAPABILITY_EXAMPLES}
        />
        <SplitCard
          title="Everyday adoption"
          subtitle="Did people and institutions actually switch to it?"
          split={current.adoption}
          typeKey="ADOPTION"
          examples={ADOPTION_EXAMPLES}
        />
      </div>
      <p className="chart-footnote">
        The remaining {current.otherDue} due predictions track hardware
        price-performance benchmarks, research milestones, broad trends, and
        societal outcomes such as life expectancy and road safety.
      </p>
    </section>
  );
}
