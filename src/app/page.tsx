import { pageMetadata } from "@/lib/site-meta";
import Link from "next/link";
import { EvidenceLink } from "@/components/evidence-panel";
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
  OUTCOME_MARKS,
  type CategoryResult,
} from "@/lib/publication";
import { StoryComparisonProvider } from "@/components/story-comparison-context";
import { TargetYearChart } from "@/components/target-year-chart";
import { CategoryExplorer } from "@/components/category-explorer";
import { GroupAnalysis } from "@/components/group-analysis";
import { READINGS, type Reading } from "@/lib/evidence-model";
import { ModeComparison } from "@/components/mode-comparison";
import { Eyebrow, Badge } from "@/components/ui";

export const metadata = pageMetadata("/", "Where was Ray Kurzweil right?");

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
  const names = categories.map((c) => c.name);
  const views = Object.fromEntries(
    READINGS.map((r) => [r, categoryResults(predictions, names, AS_OF, r)]),
  ) as Record<Reading, CategoryResult[]>;
  const outcomeNotes = {
    CORRECT: {
      description: "Arrived by the deadline.",
      example: "Wireless peripherals",
    },
    LATE: {
      description: "Came true, behind schedule.",
      example: "Brain-scale supercomputing",
    },
    PARTIAL: {
      description: "Partly fulfilled by review.",
      example: "Robots in every home",
    },
    MISSED: {
      description: "Still unfulfilled at review.",
      example: "Life expectancy over 100",
    },
  };
  const get = (name: string) => domains.find((d) => d.name === name)!;
  const hardware = get("Computing hardware"),
    medicine = get("Biology & medicine"),
    networks = get("Networks & communications"),
    robotics = get("Robotics & transportation");
  const examples = [
    {
      id: "K009",
      title: "Wireless peripherals",
      note: "Wireless keyboards and mice were in ordinary use by 2009. He was right about the technology, but less accurate about consumer preference: wired devices remained in use.",
      target: "2009",
    },
    {
      id: "K033",
      title: "Brain-scale supercomputing",
      note: "Tianhe-2 exceeded the 20-petaflop benchmark in 2013, four years after the deadline. This measures computing performance, not a simulation of the human brain.",
      target: "2009",
    },
    {
      id: "K080",
      title: "Robots in every home",
      note: "Robot vacuums handle a specific chore. The forecast called for robots in nearly every household, doing a broad range of chores.",
      target: "2019",
    },
  ];
  return (
    <div className="container publication-page">
      <section className="story-hero">
        <Eyebrow>THE KURZWEIL SCORECARD · {AS_OF_LABEL}</Eyebrow>
        <h1>Where was Ray Kurzweil right?</h1>
        <p className="story-deck">
          Kurzweil put deadlines on wireless networks, wearable computers and
          self-driving cars. We checked {stats.collected} of his forecasts
          against what happened.
        </p>
        <p className="story-thesis">
          Networks and medical tools fare better in this collection than
          robotics and transport. Of {hardware.due} computing forecasts,{" "}
          {hardware.realized} came true, {hardware.onTime} by the deadline.
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
          <div>
            <h2 id="snapshot-title">How the predictions turned out</h2>
            <p>
              {stats.eligible} predictions with deadlines passed · Our judgment
            </p>
          </div>
          <Link href="/methodology/">How we judge them ↗</Link>
        </div>
        <div className="outcome-summary">
          {OUTCOME_ORDER.map((v) => (
            <Link
              key={v}
              className={`summary-outcome summary-${v.toLowerCase()}`}
              href={scorecardUrl({ cohort: "eligible", verdict: v })}
            >
              <div className="summary-count">
                <strong>{stats.eligibleBreakdown[v]}</strong>
                <span aria-hidden="true">{OUTCOME_MARKS[v]}</span>
              </div>
              <h3>
                {OUTCOME_LABELS[v]}
                <ArrowUpRight size={17} aria-hidden="true" />
              </h3>
              <p>{outcomeNotes[v].description}</p>
              <small>e.g. {outcomeNotes[v].example}</small>
            </Link>
          ))}
        </div>
        <p className="scope-caption">
          Our judgments on a selected collection, not a lifetime accuracy score.{" "}
          {stats.collected - stats.eligible} other records are future or
          undated. <Link href="/methodology/">Scope & sources</Link>
        </p>
      </section>
      <StoryComparisonProvider views={views}>
        <section id="by-field" className="story-section">
          <div className="story-section-heading">
            <Eyebrow>THE DATA</Eyebrow>
            <h2>How the fields compare</h2>
            <p>
              In our default reading, {networks.realized} of {networks.due}{" "}
              network forecasts and {medicine.realized} of {medicine.due}{" "}
              medical forecasts were fully realized by the review date. Robotics
              and transport: {robotics.realized} of {robotics.due}. These are
              small groups drawn from an incomplete collection.
            </p>
          </div>
          <CategoryExplorer />
          <details className="editorial-disclosure">
            <summary>
              More breakdowns: decade, forecast horizon & claim type
            </summary>
            <GroupAnalysis records={predictions} asOf={AS_OF} />
          </details>
          <details className="editorial-disclosure">
            <summary>
              How the {categories.length} categories are defined
            </summary>
            <div className="taxonomy-definitions">
              {categories.map((c) => (
                <div key={c.name}>
                  <h3>{c.name}</h3>
                  <p>{c.rule}</p>
                </div>
              ))}
            </div>
          </details>
        </section>
        <TargetYearChart asOfLabel={AS_OF_LABEL} />
      </StoryComparisonProvider>
      <div className="explanation-area" id="about-the-judgments">
        <div className="explanation-divider">
          <span>Judgments & sources</span>
          <a href="#by-field">Back to the data ↑</a>
        </div>
        <section className="story-section">
          <div className="story-section-heading">
            <h2>What counts as a hit?</h2>
            <p>
              We judge each claim against its deadline and intended scale. A
              working product can satisfy a capability forecast; a prediction of
              widespread use also needs evidence of adoption.
            </p>
            <p>
              Consumer preference and regulation can limit use even when a
              technology works. We judge those cases individually and show
              alternative readings where the result is ambiguous.
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
                    <EvidenceLink predictionId={p.id}>
                      {example.title}
                    </EvidenceLink>
                  </h3>
                  <p>{example.note}</p>
                  <EvidenceLink className="text-link" predictionId={p.id}>
                    Read the evidence <ArrowRight size={14} />
                  </EvidenceLink>
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
            <h2>Check our work</h2>
            <p>
              Each record includes the forecast, our judgment, source links and
              earlier assessments. Open one to check the reasoning or compare
              alternative readings.
            </p>
            <Link className="button button-primary" href="/predictions/">
              Explore the predictions <ArrowRight size={17} />
            </Link>
          </div>
          <div className="scope-notes">
            <h3>What this collection can tell us</h3>
            <p>
              It compares {stats.collected} distinct forecast versions. Repeated
              claims count once; materially different deadlines or thresholds
              stay separate. {stats.eligible} are due, {future} are future, and{" "}
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
    </div>
  );
}
