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
import { selectReading } from "@/lib/interpretations";
import {
  categoryResults,
  OUTCOME_ORDER,
  type CategoryResult,
  type ScoredOutcome,
} from "@/lib/publication";
import { claim } from "@/lib/model";
import { READINGS, type Reading } from "@/lib/evidence-model";
import { breakdownViews } from "@/lib/collection-breakdown";
import type {
  CapabilitySplitViews,
  SnapshotCounts,
  TypeSplit,
  UpcomingBet,
} from "@/lib/ledger-data";
import { StoryComparisonProvider } from "@/components/story-comparison-context";
import { StorySnapshot } from "@/components/story-snapshot";
import { CategoryExplorer } from "@/components/category-explorer";
import { CapabilityAdoption } from "@/components/capability-adoption";
import { TargetYearChart } from "@/components/target-year-chart";
import { GroupAnalysis } from "@/components/group-analysis";
import { WhatsAhead } from "@/components/whats-ahead";
import { ModeComparison } from "@/components/mode-comparison";
import { JsonLd } from "@/components/json-ld";
import { Eyebrow, Badge } from "@/components/ui";

export const metadata = pageMetadata("/", "Where was Ray Kurzweil right?");

function splitForType(
  rows: ReturnType<typeof selectReading>[],
  type: "CAPABILITY" | "ADOPTION",
): TypeSplit {
  const stats = summarize(
    rows.filter((p) => p.claimType === type),
    AS_OF,
  );
  return {
    due: stats.eligible,
    counts: Object.fromEntries(
      OUTCOME_ORDER.map((v) => [v, stats.eligibleBreakdown[v]]),
    ) as Record<ScoredOutcome, number>,
    onTime: stats.onTime,
    realized: stats.realized,
  };
}

export default function Overview() {
  const stats = summarize(predictions, AS_OF);
  const names = categories.map((c) => c.name);
  const views = Object.fromEntries(
    READINGS.map((r) => [r, categoryResults(predictions, names, AS_OF, r)]),
  ) as Record<Reading, CategoryResult[]>;

  const summaries = Object.fromEntries(
    READINGS.map((r) => {
      const s = summarize(
        predictions.map((p) => selectReading(p, r)),
        AS_OF,
      );
      return [
        r,
        {
          due: s.eligible,
          counts: Object.fromEntries(
            OUTCOME_ORDER.map((v) => [v, s.eligibleBreakdown[v]]),
          ) as Record<ScoredOutcome, number>,
          onTime: s.onTime,
          realized: s.realized,
        },
      ];
    }),
  ) as Record<Reading, SnapshotCounts>;

  const capabilitySplits = Object.fromEntries(
    READINGS.map((r) => {
      const rows = predictions.map((p) => selectReading(p, r));
      const capability = splitForType(rows, "CAPABILITY");
      const adoption = splitForType(rows, "ADOPTION");
      return [
        r,
        {
          capability,
          adoption,
          otherDue: summaries[r].due - capability.due - adoption.due,
        },
      ];
    }),
  ) as CapabilitySplitViews;

  const upcomingBets: UpcomingBet[] = predictions
    .filter((p) => p.release?.assessment.at_deadline === "NOT_DUE")
    .map((p) => ({
      id: p.id,
      year: p.deadline.year ?? 2045,
      claim: claim(p),
      category: p.category,
      progress: (p.release?.assessment.at_review === "FULFILLED"
        ? "FULFILLED"
        : p.release?.assessment.at_review === "PARTLY_FULFILLED"
          ? "PARTLY_FULFILLED"
          : "NOT_FULFILLED") as UpcomingBet["progress"],
    }))
    .sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));

  const undated = predictions.filter(
    (p) => p.release?.assessment.at_deadline === "UNDATED",
  ).length;

  const capRef = capabilitySplits.reference.capability;
  const adoptRef = capabilitySplits.reference.adoption;
  const capPct = Math.round((capRef.realized / capRef.due) * 100);
  const adoptPct = Math.round((adoptRef.realized / adoptRef.due) * 100);

  const domains = views.reference;
  const get = (name: string) => domains.find((d) => d.name === name)!;
  const medicine = get("Biology & medicine"),
    networks = get("Networks & communications"),
    robotics = get("Robotics & transportation");

  const examples = [
    {
      id: "K009",
      title: "Wireless peripherals",
      note: "Wireless keyboards and mice were in everyday use by 2009. Kurzweil called the technology right, even though wired peripherals didn’t vanish completely.",
      target: "2009",
    },
    {
      id: "K033",
      title: "Brain-scale supercomputing",
      note: "Tianhe-2 crossed the 20-petaflop benchmark in 2013—four years behind schedule. That tests raw hardware throughput, not a working simulation of the human brain.",
      target: "2009",
    },
    {
      id: "K080",
      title: "Robots in every home",
      note: "Robot vacuums handle one narrow chore well. The prediction called for reliable household robots in nearly every home, handling a wide range of chores.",
      target: "2019",
    },
  ];

  return (
    <div className="container publication-page">
      <JsonLd
        path="/"
        name="Where was Ray Kurzweil right?"
        dateModified={AS_OF}
      />
      <section className="story-hero">
        <Eyebrow>THE KURZWEIL SCORECARD · {AS_OF_LABEL}</Eyebrow>
        <h1>Where was Ray Kurzweil right?</h1>
        <p className="story-deck">
          Kurzweil put hard deadlines on wireless networks, wearable computers,
          self-driving cars, and artificial intelligence. We checked{" "}
          {stats.collected} of his dated predictions against what actually
          happened.
        </p>
        <p className="story-thesis">
          One clear pattern stands out: he’s far sharper at predicting what
          technology will be able to do than whether people will actually adopt
          it. Among the {stats.eligible} predictions past their deadlines,{" "}
          {capPct}% of his technical capability calls came true—compared with
          just {adoptPct}% of his adoption calls.
        </p>
        <div className="story-links">
          <a className="text-link" href="#by-field">
            See the breakdown <ArrowRight size={16} />
          </a>
          <Link
            prefetch={false}
            className="text-link muted"
            href="/predictions/"
          >
            Browse all {stats.collected} predictions <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      <StoryComparisonProvider views={views}>
        <StorySnapshot
          summaries={summaries}
          upcomingCount={upcomingBets.length}
          undatedCount={undated}
        />
        <section id="by-field" className="story-section">
          <div className="story-section-heading">
            <Eyebrow>THE DATA</Eyebrow>
            <h2>How the fields compare</h2>
            <p>
              Under the Balanced reading, {networks.realized} of {networks.due}{" "}
              network forecasts and {medicine.realized} of {medicine.due}{" "}
              medical forecasts came true. Robotics and transport fared much
              worse: {robotics.realized} of {robotics.due}.
            </p>
          </div>
          <CategoryExplorer />
          <details className="editorial-disclosure">
            <summary>How the fields are defined</summary>
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
        <CapabilityAdoption splits={capabilitySplits} />
        <TargetYearChart asOfLabel={AS_OF_LABEL} />
        <details
          id="more-breakdowns"
          className="editorial-disclosure story-breakdowns"
        >
          <summary>Compare by prediction type or decade</summary>
          <GroupAnalysis views={breakdownViews(predictions, AS_OF, names)} />
        </details>
      </StoryComparisonProvider>
      <WhatsAhead bets={upcomingBets} />
      <div className="explanation-area" id="about-the-judgments">
        <div className="explanation-divider">
          <span>Judgments & sources</span>
          <a href="#by-field">Back to the data ↑</a>
        </div>
        <section className="story-section">
          <div className="story-section-heading">
            <h2>What counts as a hit?</h2>
            <p>
              We judge every claim against its original deadline and stated
              scale. A working product can satisfy a capability forecast; a
              prediction of widespread use also needs evidence that people
              actually adopted it.
            </p>
            <p>
              Preference, cost, and regulation can stall adoption even when a
              technology works. Where wording leaves room for reasonable
              disagreement, we show Literal, Balanced, and Charitable readings
              side by side.
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
            <summary>How much do the readings change the score?</summary>
            <ModeComparison records={predictions} asOf={AS_OF} />
          </details>
        </section>
        <section className="story-section scope-section">
          <div>
            <h2>Check our work</h2>
            <p>
              Every prediction links to its source passage, scoring criteria,
              real-world evidence, and revision history. Open any entry to test
              the reasoning for yourself.
            </p>
            <Link
              prefetch={false}
              className="button button-primary"
              href="/predictions/"
            >
              Explore all {stats.collected} predictions{" "}
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="scope-notes">
            <h3>About this collection</h3>
            <p>
              These {stats.collected} records span {stats.eligible} past-due
              forecasts, {upcomingBets.length} upcoming bets, and {undated}{" "}
              undated claims, reviewed through {AS_OF_LABEL}. Duplicate
              restatements count once; decade-by-decade progressions stay
              separate.
            </p>
            <p>
              Read the full scoring rules and caveats in{" "}
              <Link prefetch={false} href="/methodology/">
                Methodology
              </Link>
              , or download every source, earlier release, and all{" "}
              {originalIntake.length} original intake records on{" "}
              <Link prefetch={false} href="/sources/">
                Sources & downloads
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
