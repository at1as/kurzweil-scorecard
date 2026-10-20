import { pageMetadata } from "@/lib/site-meta";
import type { Metadata } from "next";
import Link from "next/link";
import { AS_OF, AS_OF_LABEL, predictions, originalIntake } from "@/lib/data";
import { summarize } from "@/lib/scoring";
import { scorecardUrl } from "@/lib/filters";
import { Badge, Eyebrow } from "@/components/ui";
import { ModeComparison } from "@/components/mode-comparison";
import type { Verdict } from "@/lib/model";
export const metadata: Metadata = pageMetadata("/methodology/", "Methodology");
const definitions: { v: Verdict; text: string }[] = [
  {
    v: "CORRECT",
    text: "The claim, under the stated reading, was fully realized by its deadline. The charts call this “On time.”",
  },
  {
    v: "LATE",
    text: "Fully realized after the deadline. It counts as realized, but not on time.",
  },
  {
    v: "PARTIAL",
    text: "Meaningful parts happened, but the full claim has not been met by the review date. Partial gets no fractional credit.",
  },
  {
    v: "MISSED",
    text: "The deadline passed and the claim was not fulfilled under this reading. This is a judgment as of the review date, not a claim that it can never happen.",
  },
  {
    v: "PENDING",
    text: "The deadline is still ahead. Progress can be recorded, but the prediction stays out of deadline-based scores.",
  },
];
export default function Methodology() {
  const stats = summarize(predictions, AS_OF);
  return (
    <div className="container page-container publication-page">
      <div className="page-intro editorial-intro">
        <Eyebrow>HOW WE JUDGE</Eyebrow>
        <h1>How we judge a prediction.</h1>
        <p>
          We compare each forecast with what happened, using its deadline and
          stated scale. Each record explains our interpretation and links to the
          evidence.
        </p>
      </div>
      <div className="methodology-layout">
        <nav className="contents" aria-label="Methodology contents">
          <span className="micro-label">ON THIS PAGE</span>
          <a href="#interpretation">The reading</a>
          <a href="#status">The verdicts</a>
          <a href="#dates">The dates</a>
          <a href="#counting">The counts</a>
          <a href="#coverage">The limits</a>
        </nav>
        <div className="prose">
          <section id="interpretation">
            <h2>What counts as success?</h2>
            <p>
              We read each claim in context, retaining its cost, capability,
              adoption, geography, mechanism and deadline requirements. A
              forecast of a trend does not require universal adoption.
            </p>
            <p>
              <Link href="/predictions/K009/">Wireless keyboards and mice</Link>{" "}
              were practical and in ordinary use by 2009. He was right about the
              technology, but less accurate about consumer preference: wired
              devices remained in use. Our default judgment credits the move
              toward wireless; the stricter reading also tests how far cables
              disappeared. The household robot forecast set a higher bar:{" "}
              <Link href="/predictions/K080/">
                robots in nearly every household
              </Link>
              , performing a broad range of chores.
            </p>
            <p>
              Consumer preference, cost and regulation can limit adoption even
              when a technology works. We weigh those factors case by case and
              explain the judgment. A working option may satisfy a capability
              forecast; a forecast of widespread use also needs adoption
              evidence. When the wording leaves room for disagreement, we retain
              alternative readings and identify what changes the result.
            </p>
            <p>
              Each record separates the attributed forecast from its testable
              criterion, outcome evidence and editorial verdict. The displayed
              claims are paraphrases, not verified verbatim quotations.
              “Disputed” means a reasonable alternative reading changes the
              result.
            </p>
            <details className="editorial-disclosure">
              <summary>Stricter and broader readings</summary>
              <p>
                Alternative readings can change the population or deadline as
                well as the standard of success. Broader readings may relax a
                mechanism or adoption requirement. Changed conditions are listed
                on the record; alternative readings never add extra predictions
                to the count.
              </p>
              <ModeComparison records={predictions} asOf={AS_OF} />
            </details>
          </section>
          <section id="status">
            <h2>Five outcomes.</h2>
            <div className="definition-list">
              {definitions.map((d) => (
                <article key={d.v}>
                  <Badge verdict={d.v} />
                  <p>{d.text}</p>
                </article>
              ))}
            </div>
            <p>
              Each record shows the outcome at the original deadline and at the
              review date.
            </p>
            <details className="editorial-disclosure">
              <summary>Unreviewed, unscorable and excluded records</summary>
              <p>
                <strong>Unreviewed</strong> is a research state, not a failure.{" "}
                <strong>Unscorable</strong> means no defensible test or usable
                deadline is available. <strong>Excluded</strong> marks a
                duplicate, misattribution or another documented exclusion. These
                records remain accessible and receive no points.
              </p>
              <p>
                Some undated records have assessable outcomes. Their verdicts
                remain visible, but they are excluded from deadline-based rates.
              </p>
            </details>
          </section>
          <section id="dates">
            <h2>Late means it happened.</h2>
            <p>
              A forecast that has not happened is not “late” merely because its
              date has passed. A late verdict requires evidence of full
              realization after the deadline.
            </p>
            <p>
              <Link href="/predictions/K033/">The supercomputing forecast</Link>{" "}
              had a 2009 target and reached the chosen measured-performance
              benchmark in 2013: four years late.{" "}
              <Link href="/predictions/K001/">The chess forecast</Link>{" "}
              succeeded in 1997 under either of its cited 1998 and 2000
              deadlines. That leaves its outcome clear and its exact timing
              uncertain.
            </p>
            <p>
              “Documented by 2008” means we have evidence from 2008. It does not
              mean 2008 was the first year it happened. We distinguish exact
              dates, documented-by bounds and approximate periods.
            </p>
            <p>
              Whole-year deadlines close on December 31. At this {AS_OF_LABEL}{" "}
              snapshot, a 2026 deadline is still open. Approximate dates use the
              interpretation recorded on the detail page. A later revision never
              overwrites an earlier forecast.
            </p>
          </section>
          <section id="counting">
            <h2>What is being counted?</h2>
            <p>
              The collection has {stats.collected} distinct forecast versions.{" "}
              {stats.eligible} have passed their deadlines and are eligible for
              the default comparison. Future and undated records stay out of
              both rates below.
            </p>
            <div className="formula-box">
              <span>On time</span>
              <strong>
                {stats.onTime} / {stats.eligible} ={" "}
                {(stats.onTimeRate! * 100).toFixed(1)}%
              </strong>
              <span>Fully realized by the review date, including late</span>
              <strong>
                {stats.realized} / {stats.eligible} ={" "}
                {(stats.realizationRate! * 100).toFixed(1)}%
              </strong>
            </div>
            <p>
              Both use the same predictions. Partial receives no fractional
              points; missing evidence does not automatically mean failure. The
              homepage comparison uses this group. The full ledger also includes
              future and undated records.
            </p>
            <p>
              Identical repetitions count once. Materially different deadlines
              or thresholds remain separate versions, linked to their related
              forecasts. Each version has one primary category; extra tags do
              not multiply its weight. Several versions from one forecast family
              can therefore influence a category.
            </p>
            <p>
              <Link href={scorecardUrl({ cohort: "eligible" })}>
                Inspect all {stats.eligible} predictions in the comparison →
              </Link>
            </p>
            <details className="editorial-disclosure">
              <summary>Counting and research details</summary>
              <p>
                Eligibility requires an assessed, due, canonical record with the
                supplied eligibility flag. Non-scoring comparators and
                conditional judgments on unresolved legacy wording stay out of
                every rate. Future claims stay out even if achieved early.
              </p>
              <p>
                We have not implemented family-level weighting. Category groups
                have different deadlines, claim types and selection histories,
                so these descriptive counts are not estimates of future
                forecasting skill. Zero eligible records means no rate, not zero
                accuracy.
              </p>
              <p>
                Research checks attribution, fixes a criterion, resolves
                duplicate mentions, assesses both dates and records the
                rationale. Attribution, outcome and timing confidence are stored
                separately. An unresolved original-edition detail need not erase
                an otherwise supported outcome.
              </p>
            </details>
          </section>
          <section id="coverage">
            <h2>The limits of this collection.</h2>
            <p>
              This is a selected, expanding collection, not a complete audit or
              a random sample of Kurzweil’s predictions. A one-record category
              cannot establish a general strength or weakness.
            </p>
            <p>
              The research and editorial judgments are AI-assisted and have not
              had independent human review. Most book claims were checked
              through author retrospectives, reprints or article mirrors. The
              original book editions have not been independently checked against
              those passages.
            </p>
            <p>
              Before making a lifetime accuracy claim, we would need systematic
              coverage of the books and interviews, including the full 147-item
              set of predictions for 2009, and consistent review of the
              outcomes. Precise first-achievement dates are also missing for
              many records.
            </p>
            <p>
              All {originalIntake.length} original intake rows and the v0.1,
              v0.2 and v0.3 releases are preserved. Evidence additions carry
              their own dates; rebuilding the site does not update an
              assessment.
            </p>
            <Link className="text-link" href="/sources/">
              Sources, coverage and downloads →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
