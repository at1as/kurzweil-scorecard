import { pageMetadata } from "@/lib/site-meta";
import type { Metadata } from "next";
import Link from "next/link";
import { AS_OF, AS_OF_LABEL, predictions, originalIntake } from "@/lib/data";
import { summarize } from "@/lib/scoring";
import { scorecardUrl } from "@/lib/filters";
import { Badge, Eyebrow } from "@/components/ui";
import { EvidenceLink } from "@/components/evidence-panel";
import { ModeComparison } from "@/components/mode-comparison";
import type { Verdict } from "@/lib/model";

export const metadata: Metadata = pageMetadata(
  "/methodology/",
  "Methodology",
  "How this scorecard judges Kurzweil’s predictions: deadlines, outcomes, Literal/Balanced/Charitable readings, scoring rules, and limits.",
);

const definitions: { v: Verdict; text: string }[] = [
  {
    v: "CORRECT",
    text: "Fully realized by its deadline under the selected reading.",
  },
  {
    v: "LATE",
    text: "Fully realized after the deadline. Counts as realized, but not on time.",
  },
  {
    v: "PARTIAL",
    text: "Meaningful progress happened, but the core claim hasn’t been fully met yet. Partial receives no fractional credit.",
  },
  {
    v: "MISSED",
    text: "The deadline passed and the claim went unfulfilled as of our review cutoff. That isn’t a claim it can never happen later.",
  },
  {
    v: "PENDING",
    text: "The deadline is still ahead. We track current progress, but keep upcoming bets out of the scorecard rates.",
  },
];

export default function Methodology() {
  const stats = summarize(predictions, AS_OF);
  return (
    <div className="container page-container publication-page">
      <div className="page-intro editorial-intro">
        <Eyebrow>HOW WE JUDGE</Eyebrow>
        <h1>How we judge a prediction</h1>
        <p>
          We check each claim against its original deadline and stated scale.
          Every record lays out what would count as success, links to the
          evidence, and shows how stricter or more generous readings change the
          result.
        </p>
      </div>
      <div className="methodology-layout">
        <nav className="contents" aria-label="Methodology contents">
          <span className="micro-label">ON THIS PAGE</span>
          <a href="#interpretation">The readings</a>
          <a href="#status">The verdicts</a>
          <a href="#dates">The dates</a>
          <a href="#counting">The counts</a>
          <a href="#coverage">The limits</a>
        </nav>
        <div className="prose">
          <section id="interpretation">
            <h2>What counts as success?</h2>
            <p>
              We read each prediction in context, preserving its cost,
              capability, adoption, geography, mechanism, and deadline
              requirements. A trend claim doesn’t require universal adoption,
              and a working prototype doesn’t satisfy a claim about everyday
              use.
            </p>
            <p>
              <EvidenceLink predictionId="K009">
                Wireless keyboards and mice
              </EvidenceLink>{" "}
              were practical and widely used by 2009. Kurzweil called the
              technology right, even though wired peripherals didn’t disappear.
              The Balanced reading credits that shift toward wireless; the
              Literal reading tests how completely cables vanished. The
              household robot forecast set a much higher bar:{" "}
              <EvidenceLink predictionId="K080">
                robots in nearly every home
              </EvidenceLink>
              , handling a wide range of chores.
            </p>
            <p>
              Preference, cost, and regulation often slow adoption long after a
              technology works. We weigh those cases individually and show three
              readings—Literal, Balanced, and Charitable—so you can see exactly
              where reasonable interpretations diverge. A record is marked{" "}
              <em>Disputed</em> whenever those readings produce different
              verdicts.
            </p>
            <details className="editorial-disclosure">
              <summary>Literal, Balanced, and Charitable readings</summary>
              <p>
                Every due prediction is assessed under all three readings.{" "}
                <strong>Literal</strong> enforces the stated mechanism, form
                factor, scope, and adoption bar closely.{" "}
                <strong>Balanced</strong> (our default) uses a fair,
                common-sense reading in context. <strong>Charitable</strong>{" "}
                credits reasonable functional substitutes—like cloud storage in
                place of home servers—without rewriting failed technologies into
                unrelated hits.
              </p>
              <ModeComparison records={predictions} asOf={AS_OF} />
            </details>
          </section>
          <section id="status">
            <h2>Five outcomes</h2>
            <div className="definition-list">
              {definitions.map((d) => (
                <article key={d.v}>
                  <Badge verdict={d.v} />
                  <p>{d.text}</p>
                </article>
              ))}
            </div>
            <p>
              Every record tracks both the outcome at its original deadline and
              its status as of {AS_OF_LABEL}.
            </p>
            <details className="editorial-disclosure">
              <summary>Unreviewed, unscorable, and excluded records</summary>
              <p>
                <strong>Unreviewed</strong> is an intake state, not a failure.{" "}
                <strong>Unscorable</strong> means no clear test or usable
                deadline exists. <strong>Excluded</strong> marks a duplicate or
                misattributed claim. None of these enters the rates.
              </p>
              <p>
                Two undated predictions still show outcome verdicts in the full
                list, but stay out of deadline-based rates.
              </p>
            </details>
          </section>
          <section id="dates">
            <h2>Late means it happened</h2>
            <p>
              Passing a deadline without fulfillment doesn’t make a prediction
              “late”—it makes it missed or partial. Earning a Late verdict
              requires evidence that the prediction actually came true after its
              target year.
            </p>
            <p>
              <EvidenceLink predictionId="K033">
                The supercomputing forecast
              </EvidenceLink>{" "}
              targeted 2009 and crossed 20 petaflops on sustained LINPACK in
              2013—four years late.{" "}
              <EvidenceLink predictionId="K001">
                The chess forecast
              </EvidenceLink>{" "}
              was fulfilled in 1997 under both of its cited 1998 and 2000
              deadlines, leaving its outcome clear even though the exact edition
              date varies.
            </p>
            <p>
              “Documented by 2008” means our earliest cited evidence dates to
              2008, not that 2008 was necessarily the first year it happened.
              Whole-year deadlines close on December 31; at our {AS_OF_LABEL}{" "}
              cutoff, 2026 deadlines remain open. Approximate windows such as
              “mid-2020s” or “early 2030s” close at the end of the window (2026
              and 2033).
            </p>
          </section>
          <section id="counting">
            <h2>What is being counted?</h2>
            <p>
              The scorecard tracks {stats.collected} predictions.{" "}
              {stats.eligible} have passed their deadlines and make up the
              scored cohort below; upcoming and undated predictions stay out of
              both rates.
            </p>
            <div className="formula-box">
              <span>On time</span>
              <strong>
                {stats.onTime} / {stats.eligible} ={" "}
                {(stats.onTimeRate! * 100).toFixed(1)}%
              </strong>
              <span>Fully realized by review (on time or late)</span>
              <strong>
                {stats.realized} / {stats.eligible} ={" "}
                {(stats.realizationRate! * 100).toFixed(1)}%
              </strong>
            </div>
            <p>
              Duplicate restatements of the same forecast count once.
              Decade-by-decade progressions with materially higher bars—such as
              lifespan over 100 in 2019 and 120 in 2029—stay separate and link
              to one another. Each prediction belongs to one primary field.
            </p>
            <p>
              <Link href={scorecardUrl({ cohort: "eligible" })}>
                Inspect all {stats.eligible} scored predictions →
              </Link>
            </p>
          </section>
          <section id="coverage">
            <h2>The limits of this collection</h2>
            <p>
              This is a curated collection of {stats.collected} predictions, not
              a complete census of every forecast Ray Kurzweil has ever made.
              Fields vary in sample size—a one-prediction category can’t tell
              you much on its own—and older targets have had longer to arrive
              late than 2019 ones.
            </p>
            <p>
              The research, claim paraphrases, and editorial verdicts are
              AI-assisted and have not undergone independent human peer review.
              Most book claims were checked through Kurzweil’s retrospectives,
              reprints, or archived editions rather than page-by-page collation
              against first-edition print copies. A complete lifetime audit
              would require systematically extracting all 147 predictions for
              2009 alongside his later books and interviews.
            </p>
            <p>
              Every original intake row ({originalIntake.length} leads) and
              versioned release (v0.1 through v0.4) is preserved for inspection.
            </p>
            <Link className="text-link" href="/sources/">
              Sources, coverage, and downloads →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
