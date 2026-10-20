import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  AS_OF,
  AS_OF_LABEL,
  categories,
  predictions,
  originalIntake,
} from "@/lib/data";
import { summarize, verdict } from "@/lib/scoring";
import { scorecardUrl } from "@/lib/filters";
import {
  categoryResults,
  OUTCOME_LABELS,
  OUTCOME_ORDER,
} from "@/lib/publication";
import { CategoryChart } from "@/components/category-chart";
import { ModeComparison } from "@/components/mode-comparison";
import { Eyebrow, Badge } from "@/components/ui";

export default function Overview() {
  const stats = summarize(predictions, AS_OF);
  const future = predictions.filter(
    (p) => p.release?.assessment.at_deadline === "NOT_DUE",
  ).length;
  const undated = predictions.filter(
    (p) => p.release?.assessment.at_deadline === "UNDATED",
  ).length;
  const domains = categoryResults(
    predictions,
    categories.map((c) => c.name),
    AS_OF,
  );
  const get = (name: string) => domains.find((d) => d.name === name)!;
  const hardware = get("Computing hardware"),
    medicine = get("Biology & medicine"),
    networks = get("Networks & communications"),
    robotics = get("Robotics & transportation");
  const examples = [
    {
      id: "K009",
      title: "Wireless peripherals",
      note: "Bluetooth keyboards and mice count. The survival of charging cables doesn’t undo the shift.",
      target: "2009",
    },
    {
      id: "K033",
      title: "Brain-scale supercomputing",
      note: "The chosen numerical benchmark was reached in 2013, four years after the deadline. Matching a compute benchmark is not reproducing a brain.",
      target: "2009",
    },
    {
      id: "K080",
      title: "Robots in every home",
      note: "Robot vacuums became a real market. That falls short of near-universal household robots handling a broad range of chores.",
      target: "2019",
    },
  ];
  return (
    <div className="container publication-page">
      <section className="story-hero">
        <Eyebrow>THE KURZWEIL SCORECARD · {AS_OF_LABEL}</Eyebrow>
        <h1>Where was Ray Kurzweil right?</h1>
        <p className="story-deck">
          Wireless networks. Wearable computers. Cars that drive themselves.
          Kurzweil put dates on them. We checked {stats.collected} predictions
          against what happened.
        </p>
        <p className="story-thesis">
          The results vary by field. Networks and medical tools fare better in
          this collection than robotics and transport. Computing has plenty of
          hits, often late.
        </p>
        <div className="story-links">
          <a className="text-link" href="#by-field">
            See the breakdown <ArrowRight size={16} />
          </a>
          <Link className="text-link muted" href="/predictions/">
            Browse all {stats.collected} predictions <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      <section
        id="state"
        className="story-snapshot"
        aria-labelledby="snapshot-title"
      >
        <div className="snapshot-title">
          <h2 id="snapshot-title">
            Of {stats.eligible} predictions with deadlines passed
          </h2>
          <Link href="/methodology/">How we judge them ↗</Link>
        </div>
        <div className="outcome-summary">
          {OUTCOME_ORDER.map((v) => (
            <Link
              key={v}
              className={`summary-outcome summary-${v.toLowerCase()}`}
              href={scorecardUrl({ cohort: "eligible", verdict: v })}
            >
              <strong>{stats.eligibleBreakdown[v]}</strong>
              <span>{OUTCOME_LABELS[v]}</span>
            </Link>
          ))}
        </div>
        <p className="scope-caption">
          Our judgments on a selected collection, not a lifetime accuracy score.{" "}
          {stats.collected - stats.eligible} other records are future or
          undated. <Link href="/methodology/">Scope & sources</Link>
        </p>
      </section>
      <section id="by-field" className="story-section">
        <div className="story-section-heading">
          <Eyebrow>01 / THE PATTERN</Eyebrow>
          <h2>How the fields compare.</h2>
          <p>
            {networks.realized} of {networks.due} network forecasts and{" "}
            {medicine.realized} of {medicine.due} medical forecasts were fully
            realized by the review date. Robotics and transport:{" "}
            {robotics.realized} of {robotics.due}. These are small groups, but
            the contrast is worth examining.
          </p>
        </div>
        <CategoryChart rows={domains.filter((d) => d.due >= 4)} />
        <div className="chart-followup">
          <p>
            Computing is the largest group: {hardware.realized} of{" "}
            {hardware.due} came true, {hardware.onTime} on time. A field can
            have both substantial successes and substantial misses.
          </p>
          <Link className="text-link" href="/categories/">
            All {categories.length} fields & alternative readings{" "}
            <ArrowRight size={16} />
          </Link>
        </div>
        <p className="chart-footnote">
          Shown above: fields with at least four due predictions. Smaller
          samples and fields without past deadlines are on the category page.
        </p>
      </section>
      <section className="story-section">
        <div className="story-section-heading">
          <Eyebrow>02 / THE JUDGMENT</Eyebrow>
          <h2>What counts as a hit?</h2>
          <p>
            We use a reasonable reading of each claim, keeping its deadline and
            scale. A technology existing, becoming common, and taking over are
            three different predictions.
          </p>
        </div>
        <div className="editorial-examples">
          {examples.map((example) => {
            const p = predictions.find((p) => p.id === example.id)!;
            return (
              <article key={p.id}>
                <div className="example-meta">
                  <Badge verdict={verdict(p, AS_OF)} />
                  <span>Target: {example.target}</span>
                </div>
                <h3>
                  <Link href={`/predictions/${p.id}/`}>
                    {example.title}
                    <ArrowUpRight size={17} />
                  </Link>
                </h3>
                <p>{example.note}</p>
                <Link className="text-link" href={`/predictions/${p.id}/`}>
                  Read the evidence <ArrowRight size={14} />
                </Link>
              </article>
            );
          })}
        </div>
        <details className="editorial-disclosure reading-sensitivity">
          <summary>How much do the judgments change the score?</summary>
          <ModeComparison records={predictions} asOf={AS_OF} />
        </details>
      </section>
      <section className="story-section scope-section">
        <div>
          <Eyebrow>03 / THE EVIDENCE</Eyebrow>
          <h2>Check our work.</h2>
          <p>
            Every record links the forecast, our interpretation, and the outcome
            evidence. You can disagree with a judgment without losing the
            underlying facts.
          </p>
          <Link className="button button-primary" href="/predictions/">
            Explore the predictions <ArrowRight size={17} />
          </Link>
        </div>
        <div className="scope-notes">
          <h3>What this collection can tell us</h3>
          <p>
            It compares {stats.collected} distinct forecast versions. Repeated
            claims count once; materially different deadlines or thresholds stay
            separate. {stats.eligible} are due, {future} are future, and{" "}
            {undated} lack a usable deadline.
          </p>
          <p>
            The selection is incomplete and uneven across fields. Most book
            claims were checked through reprints or retrospectives; original
            editions still need checking. The research and judgments are
            AI-assisted and have not had independent human review.
          </p>
          <p>
            Outcomes are assessed through {AS_OF_LABEL}. The{" "}
            <Link href="/sources/">sources and downloads</Link> include all{" "}
            {originalIntake.length} original intake records and earlier
            assessments.
          </p>
        </div>
      </section>
    </div>
  );
}
