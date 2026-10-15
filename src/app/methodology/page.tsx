import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AS_OF, AS_OF_LABEL, predictions } from "@/lib/data";
import { summarize } from "@/lib/scoring";
import { scorecardUrl } from "@/lib/filters";
import { Badge, Eyebrow, Notice } from "@/components/ui";
import type { Verdict } from "@/lib/model";
export const metadata: Metadata = { title: "Methodology & scoring rules" };
const definitions: { v: Verdict; text: string; treatment: string }[] = [
  {
    v: "CORRECT",
    text: "The full original claim was realized by its original deadline. An early realization is also correct, with early timing shown separately.",
    treatment:
      "One full hit if its deadline is due and it is verified, scorable, and canonical.",
  },
  {
    v: "LATE",
    text: "The full original claim was realized after its original deadline. Its historical at-deadline failure remains unchanged.",
    treatment:
      "Zero on-time hits; one full-realization hit in the same eligible population.",
  },
  {
    v: "PARTIAL",
    text: "Meaningful elements of a due claim were realized, but its full original criteria have not been met.",
    treatment: "Counted separately. No arbitrary fractional points.",
  },
  {
    v: "MISSED",
    text: "The original deadline has passed and the full claim remains unfulfilled without material partial fulfillment. A missed date does not mean the event is impossible forever.",
    treatment: "Zero on-time hits; zero full-realization hits.",
  },
  {
    v: "PENDING",
    text: "The original deadline has not yet passed and the full claim has not been fulfilled. Partial progress may be recorded without closing a future forecast.",
    treatment: "Excluded from both deadline-based accuracy denominators.",
  },
  {
    v: "UNSCORABLE",
    text: "Verified wording cannot be judged with a defensible success criterion or deadline, or an explicit condition is inapplicable. The reason must be recorded.",
    treatment: "Excluded, with the count and explanation visible.",
  },
  {
    v: "UNREVIEWED",
    text: "Attribution, criteria, or outcome verification is incomplete. This is a research state, not an outcome verdict.",
    treatment: "Excluded from accuracy and realization statistics.",
  },
  {
    v: "EXCLUDED",
    text: "A duplicate, misattribution, non-prediction, or other documented exclusion. The original record and reason remain available.",
    treatment: "Excluded from the denominator. Never silently deleted.",
  },
];
export default function Methodology() {
  const stats = summarize(predictions, AS_OF);
  return (
    <div className="container page-container">
      <div className="page-intro">
        <Eyebrow>THE RULES BEFORE THE RESULTS</Eyebrow>
        <h1>What counts as getting it right?</h1>
        <p>
          A transparent scorecard needs fixed criteria, original deadlines,
          <br />
          and a visible denominator. Here is ours.
        </p>
      </div>
      <div className="methodology-layout">
        <nav className="contents" aria-label="Methodology contents">
          <span className="micro-label">ON THIS PAGE</span>
          <a href="#status">01 · Status definitions</a>
          <a href="#dates">02 · Dates & timing</a>
          <a href="#counting">03 · Counting & deduplication</a>
          <a href="#interpretation">04 · Interpretation & disputes</a>
          <a href="#verification">05 · Verification process</a>
          <a href="#coverage">06 · Coverage & limitations</a>
        </nav>
        <div className="prose">
          <Notice>
            <strong>Snapshot: {AS_OF_LABEL}.</strong> {stats.collected}{" "}
            collected records, {stats.verified} verified canonical forecasts,{" "}
            {stats.eligible} due and eligible. These working materials are not a
            completed historical audit.
          </Notice>
          <section id="status">
            <h2>01. Status definitions</h2>
            <p>
              Source text is kept separate from normalized claims and editorial
              assessments. A verdict summarizes the record; the detail page
              retains the outcomes at the original deadline and at the review
              date.
            </p>
            <div className="definition-list">
              {definitions.map((d) => (
                <article key={d.v}>
                  <Badge verdict={d.v} />
                  <p>{d.text}</p>
                  <small>{d.treatment}</small>
                </article>
              ))}
            </div>
            <p>
              <strong>Disputed</strong> is an additional flag, not a replacement
              verdict. Early and overdue are timing qualifiers; they never
              create extra points.
            </p>
          </section>
          <section id="dates">
            <h2>02. A deadline is part of the prediction</h2>
            <p>
              We preserve the original target wording and deadline. A later
              repetition or revision becomes a linked historical version; it
              never overwrites an earlier promise.
            </p>
            <p>
              Whole-year deadlines stay open through December 31. At the{" "}
              {AS_OF_LABEL} snapshot, whole-year 2026 targets are still open;
              the mature cohort includes year-only deadlines through 2025. An
              exact date closes after that calendar day. We do not assign
              precise endpoints to vague imported date ranges.
            </p>
            <div className="worked-example">
              <span className="micro-label">
                ILLUSTRATIVE RULE EXAMPLE · NOT A DATASET RECORD
              </span>
              <div>
                <span>
                  Deadline<strong>2009</strong>
                </span>
                <ArrowRight size={20} />
                <span>
                  Full realization<strong>2015</strong>
                </span>
                <ArrowRight size={20} />
                <span>
                  Result<strong>Late, +6y</strong>
                </span>
              </div>
              <p>
                The prediction missed its original date. It counts toward
                realization, but never toward on-time accuracy. If it is still
                unfulfilled, it remains missed; it is not labeled late merely
                because time has passed.
              </p>
            </div>
            <p>
              Timing drift is the first documented year of full achievement
              minus the confirmed deadline year. It is a calendar-year
              difference, not an exact elapsed duration. It is unavailable for
              partial or unmet claims, or when either date is uncertain.
              Forecast horizons use confirmed publication and deadline years
              only.
            </p>
          </section>
          <section id="counting">
            <h2>03. Count forecasts, not mentions</h2>
            <p>
              The primary unit is a verified, deduplicated dated forecast with
              one fixed success criterion. Each has one primary category, any
              number of secondary tags, and an explicit canonical scoring key.
              Duplicate mentions stay browsable but contribute no additional
              successes or failures.
            </p>
            <p>
              Materially revised deadlines are distinct dated forecast versions,
              linked by a forecast family. Repetitions of the same claim and
              deadline share one canonical key. Family-level weighting and
              parent-weighted sensitivity analyses are not implemented in this
              release; versions remain identifiable so those analyses can be
              added.
            </p>
            <div className="formula-box">
              <span>Strict on-time accuracy</span>
              <strong>Full at original deadline ÷ eligible forecasts</strong>
              <span>Full realization by review</span>
              <strong>
                Full at deadline or by review ÷ the same eligible forecasts
              </strong>
            </div>
            <p>
              <strong>
                Eligible means verified, canonical, due, and scorable.
              </strong>{" "}
              Future deadlines—including forecasts achieved early—are excluded
              from both rates. Partial outcomes receive no fractional credit.
              Missing data is not a zero. A zero-sized denominator produces “Not
              yet available.”
            </p>
            <p>
              Verdict distributions cover verified canonical forecasts,
              including pending and unscorable records; they therefore use a
              different, explicitly labeled population from deadline-based
              accuracy. Drift uses verified canonical full realizations with
              established years. Clicking a chart or rate opens its underlying
              records.
            </p>
            <Link
              className="text-link"
              href={scorecardUrl({ cohort: "eligible" })}
            >
              Inspect the current eligible population ({stats.eligible}){" "}
              <ArrowRight size={15} />
            </Link>
            <p>
              Unresolved duplicate candidates do not imply a known unique
              forecast count. One claim tagged across multiple fields still
              contributes only once to overall statistics.
            </p>
          </section>
          <section id="interpretation">
            <h2>04. A generous reading is a different reading</h2>
            <p>
              The primary verdict uses the full original scope. We preserve
              quantitative thresholds, geography, population, price/performance,
              adoption requirements, conditions, and explicitly required
              technologies. A similar capability implemented another way may be
              relevant context without satisfying the original claim.
            </p>
            <p>
              A laboratory demonstration, a commercial product, and widespread
              use are different milestones. Falling solar costs do not prove
              that solar supplies all energy. The existence of drones does not
              prove that humans are far from battle. Partial credit requires a
              material part of the actual claim, not adjacent research.
            </p>
            <p>
              Reasonable competing interpretations are recorded in the detail
              page and marked DISPUTED. The primary rates retain the documented
              strict reading, with the disputed count disclosed. No alternative
              percentage is silently substituted, and no generous weighting is
              presented as the primary score.
            </p>
          </section>
          <section id="verification">
            <h2>05. From lead to verified forecast</h2>
            <ol>
              <li>
                <strong>Check attribution.</strong> Locate the original edition,
                interview, or recording. Preserve wording and a page, paragraph,
                or timestamp. Confirm publication dates.
              </li>
              <li>
                <strong>Fix the test.</strong> Normalize the claim while
                retaining every meaningful threshold. Establish its deadline and
                success criteria before judging outcomes.
              </li>
              <li>
                <strong>Resolve the unit.</strong> Link repetitions, split only
                defensible atomic claims, assign a forecast family, and document
                the canonical decision.
              </li>
              <li>
                <strong>Research both dates.</strong> Gather dated evidence for
                the original deadline and the review snapshot. Record the first
                full-achievement year only when supported.
              </li>
              <li>
                <strong>Document the assessment.</strong> Record rationale,
                evidence, confidence, reviewer, last reviewed date, and
                unresolved disagreements.
              </li>
            </ol>
            <p>
              The workflow states are UNREVIEWED, ATTRIBUTION_CHECKED,
              EVIDENCE_CHECKED, VERIFIED, and EXCLUDED. Intermediate checks do
              not grant entry into accuracy statistics. Reviews are historical
              snapshots; advancing the snapshot date requires updating outcomes
              for deadlines that have newly closed.
            </p>
          </section>
          <section id="coverage">
            <h2>06. What this collection can—and cannot—say</h2>
            <p>
              The initial dataset contains 88 imported candidate rows from
              earlier research, including possible duplicates. Legacy scores and
              aggregate percentages are archived; they are not independent
              evidence and are never automatically promoted to official ratings.
            </p>
            <p>
              The source inventory distinguishes imported reports, located
              primary sources, sampled materials, and unprocessed books or
              interviews. It is not an exhaustive corpus of Kurzweil’s
              predictions. Collection bias and small samples limit comparisons,
              even once individual records are verified.
            </p>
            <p>
              This first release delivers the research infrastructure.
              Systematic extraction and independent historical fact-checking are
              a separate phase. Source-coverage states are inherited from the
              supplied workbook, not claims of new research performed for this
              site.
            </p>
            <Link className="button button-primary" href="/sources/">
              Explore source coverage <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
