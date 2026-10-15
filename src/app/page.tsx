import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  BookOpen,
  CheckCheck,
  ScanText,
} from "lucide-react";
import { AS_OF, AS_OF_LABEL, categories, predictions } from "@/lib/data";
import { summarize, rate, verdict } from "@/lib/scoring";
import { scorecardUrl, targetDecade } from "@/lib/filters";
import { claim, LABELS } from "@/lib/model";
import { BarChart, DriftChart, VerdictChart } from "@/components/charts";
import { Eyebrow, Notice, SectionHeading, Badge } from "@/components/ui";
import { GroupAnalysis } from "@/components/group-analysis";
export default function Overview() {
  const stats = summarize(predictions, AS_OF);
  const domains = categories
    .map((c) => ({
      name: c.name,
      count: predictions.filter((p) => p.category === c.name).length,
    }))
    .sort((a, b) => b.count - a.count);
  const decades = [...new Set(predictions.map(targetDecade))]
    .sort()
    .map((name) => ({
      name,
      count: predictions.filter((p) => targetDecade(p) === name).length,
    }));
  const featured = ["AUD-001", "AUD-004", "AUD-014"]
    .map((id) => predictions.find((p) => p.id === id))
    .filter((p) => p !== undefined);
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <Eyebrow>
            <span className="live-dot" />A living research project{" "}
            <span className="eyebrow-divider">/</span> Edition 01
          </Eyebrow>
          <h1>
            Ray Kurzweil
            <br />
            <em>Prediction Scorecard</em>
          </h1>
          <p className="hero-subtitle">
            An evidence-based audit of technological forecasting
          </p>
          <p className="hero-description">
            He put dates on the future.
            <br />
            How well did those predictions hold up?
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/predictions/">
              Explore the predictions <ArrowRight size={17} />
            </Link>
            <Link className="text-link" href="/methodology/">
              Read our methodology <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <div className="hero-aside">
          <div className="orbit-art" aria-hidden="true">
            <svg viewBox="0 0 380 330">
              <defs>
                <pattern
                  id="grid"
                  width="24"
                  height="24"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1" cy="1" r=".7" fill="#a7ada1" />
                </pattern>
              </defs>
              <rect width="380" height="330" fill="url(#grid)" />
              <path
                d="M 15 284 L 365 284 M 45 310 L 45 20"
                stroke="#bcc2b7"
                fill="none"
              />
              <path
                d="M45 278 C95 278 145 267 185 238 S250 164 310 50"
                stroke="#9eac94"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 6"
              />
              <path
                d="M45 278 C120 279 140 251 180 255 S220 210 250 200 S279 176 294 140"
                stroke="#354f40"
                strokeWidth="2.5"
                fill="none"
              />
              <circle
                cx="294"
                cy="140"
                r="7"
                fill="#f7f5ee"
                stroke="#354f40"
                strokeWidth="2"
              />
              <circle cx="310" cy="50" r="5" fill="#bb8551" />
              <path
                d="M294 140 L310 50"
                stroke="#bb8551"
                strokeDasharray="3 5"
              />
              <text x="75" y="310" className="svg-mono">
                PREDICTION
              </text>
              <text x="243" y="310" className="svg-mono">
                REALITY
              </text>
            </svg>
            <span className="art-note">
              THE DISTANCE BETWEEN
              <br />A CLAIM AND ITS EVIDENCE.
            </span>
          </div>
          <span className="diagram-caption">
            Conceptual illustration · not observed data
          </span>
        </div>
      </section>
      <div className="snapshot-strip">
        <span>
          <span className="small-square" />
          Research snapshot
        </span>
        <time dateTime={AS_OF}>{AS_OF_LABEL}</time>
        <a href="#state">
          The state of the scorecard <ArrowDown size={14} />
        </a>
      </div>
      <section id="state" className="section">
        <SectionHeading
          index="01"
          title="A scorecard built on evidence."
          href="/methodology/"
          linkLabel="Our standard"
        >
          Collection is the starting point. Verification is what makes a score
          meaningful.
        </SectionHeading>
        <div className="metric-grid">
          <Link className="metric" href="/predictions/">
            <span>Candidate records collected</span>
            <strong>
              {stats.collected}
              <ArrowUpRight size={23} />
            </strong>
            <p>Includes possible repetitions</p>
          </Link>
          <Link
            className="metric"
            href={scorecardUrl({ view: "verified", cohort: "canonical" })}
          >
            <span>Verified & canonical</span>
            <strong>
              {stats.verified}
              <span className="metric-denominator">/ {stats.collected}</span>
            </strong>
            <p>Source, scope, and outcome checked</p>
          </Link>
          <Link className="metric" href={scorecardUrl({ cohort: "eligible" })}>
            <span>Strict on-time accuracy</span>
            <strong className={stats.onTimeRate === null ? "unavailable" : ""}>
              {stats.onTimeRate === null ? "—" : rate(stats.onTimeRate)}
            </strong>
            <p>
              {stats.onTimeRate === null
                ? "Not yet available"
                : `${stats.onTime} of ${stats.eligible} eligible forecasts`}
            </p>
          </Link>
          <Link className="metric" href={scorecardUrl({ cohort: "eligible" })}>
            <span>Full realization by review</span>
            <strong
              className={stats.realizationRate === null ? "unavailable" : ""}
            >
              {stats.realizationRate === null
                ? "—"
                : rate(stats.realizationRate)}
            </strong>
            <p>
              {stats.realizationRate === null
                ? "Not yet available"
                : `${stats.realized} of ${stats.eligible} eligible forecasts`}
            </p>
          </Link>
        </div>
        <Notice>
          <strong>{stats.unreviewed} records await verification.</strong>{" "}
          Imported statements are research leads, not established quotations or
          scored outcomes. Unique forecast count is{" "}
          {stats.canonical
            ? `${stats.canonical} resolved canonical forecasts; deduplication may be incomplete`
            : "not yet established; deduplication is still pending"}
          .{" "}
          <Link href="/methodology/">
            What counts as verified? <ArrowUpRight size={13} />
          </Link>
        </Notice>
        <div className="outcome-strip">
          {(["CORRECT", "LATE", "PARTIAL", "MISSED", "PENDING"] as const).map(
            (v) => (
              <Link
                key={v}
                href={scorecardUrl({
                  verdict: v,
                  cohort: "canonical",
                  view: "verified",
                })}
              >
                <Badge verdict={v} />
                <strong>{stats.verified ? stats.breakdown[v] : "—"}</strong>
              </Link>
            ),
          )}
        </div>
        <p className="footnote">
          Outcome counts use verified canonical forecasts only. “—” means no
          verified population, not a zero success rate. Deadline-based rates
          exclude all future deadlines.
        </p>
        <p className="footnote population-note">
          <Link href={scorecardUrl({ cohort: "eligible" })}>
            Eligible denominator: {stats.eligible}
          </Link>
          <span>Verified &amp; scorable: {stats.scored}</span>
          <Link
            href={scorecardUrl({
              verdict: "UNSCORABLE",
              cohort: "canonical",
              view: "verified",
            })}
          >
            Unscorable: {stats.breakdown.UNSCORABLE}
          </Link>
          <Link href={scorecardUrl({ verdict: "EXCLUDED" })}>
            Excluded: {stats.excluded}
          </Link>
          <span>Disputed among verified canonical: {stats.disputed}</span>
        </p>
      </section>
      <section className="section">
        <SectionHeading
          index="02"
          title="Mapping the predictions."
          href="/categories/"
          linkLabel="Compare categories"
        >
          A first look at the collection. These are coverage counts, not
          accuracy ratings.
        </SectionHeading>
        <div className="chart-grid">
          <article className="panel">
            <div className="panel-heading">
              <h3>Across the disciplines</h3>
              <span className="micro-label">
                {predictions.length} CANDIDATES
              </span>
            </div>
            <BarChart
              items={domains.slice(0, 7)}
              filter="category"
              total={predictions.length}
              label="Candidate records by draft category"
            />
            <Link className="panel-bottom-link" href="/categories/">
              Explore all {categories.length} categories{" "}
              <ArrowUpRight size={15} />
            </Link>
          </article>
          <article className="panel">
            <div className="panel-heading">
              <h3>Dates on the future</h3>
              <span className="micro-label">TARGET DECADES</span>
            </div>
            <BarChart
              items={decades}
              filter="target"
              total={predictions.length}
              label="Candidate records by provisional target decade"
              color="sand"
            />
            <p className="chart-caption">
              Grouped from imported target text. Ambiguous or multi-decade
              targets stay unresolved. No deadline has been inferred for
              scoring.
            </p>
          </article>
        </div>
      </section>
      <section className="section">
        <SectionHeading index="03" title="Accuracy, without shortcuts.">
          A forecast can get the direction right and still get the date wrong.
          We measure both.
        </SectionHeading>
        <div className="chart-grid">
          <article className="panel">
            <div className="panel-heading">
              <h3>Verdict distribution</h3>
              <span className="micro-label">n = {stats.verified} VERIFIED</span>
            </div>
            <VerdictChart records={predictions} asOf={AS_OF} />
          </article>
          <article className="panel">
            <div className="panel-heading">
              <h3>Timing drift</h3>
              <span className="micro-label">
                n = {stats.drifts.length} REALIZED
              </span>
            </div>
            <DriftChart records={predictions} asOf={AS_OF} />
          </article>
        </div>
        <div className="panel analytics-panel">
          <GroupAnalysis
            records={predictions}
            asOf={AS_OF}
            initialGroup="target"
            compact
          />
        </div>
      </section>
      <section className="section">
        <SectionHeading
          index="04"
          title="Every prediction has a paper trail."
          href="/predictions/"
          linkLabel="Open the full scorecard"
        >
          Start with a claim. Follow its source, deadline, and outstanding
          questions.
        </SectionHeading>
        <div className="prediction-cards">
          {featured.map((p, i) => (
            <Link
              href={`/predictions/${p.id}/`}
              className="prediction-card"
              key={p.id}
            >
              <div className="card-top">
                <span className="mono">{p.id}</span>
                <ArrowUpRight size={19} />
              </div>
              <span className="micro-label">{p.category}</span>
              <h3>{claim(p)}</h3>
              <div className="card-bottom">
                <span>
                  Target: {p.deadline.originalText}
                  <small>
                    {p.deadline.precision === "UNCONFIRMED"
                      ? "Unconfirmed"
                      : "Confirmed"}
                  </small>
                </span>
                <Badge verdict={verdict(p, AS_OF)} />
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="research-banner">
        <div>
          <Eyebrow>THE RESEARCH STANDARD</Eyebrow>
          <h2>
            Show the claim.
            <br />
            Show the evidence.
            <br />
            <em>Then show the score.</em>
          </h2>
        </div>
        <div className="principles">
          <div>
            <BookOpen size={20} />
            <p>
              <strong>Original words matter.</strong> Preserve the scope,
              thresholds, and technology the prediction actually required.
            </p>
          </div>
          <div>
            <CheckCheck size={20} />
            <p>
              <strong>Dates are part of the forecast.</strong> A late success
              never becomes an on-time hit.
            </p>
          </div>
          <div>
            <ScanText size={20} />
            <p>
              <strong>Make the uncertainty visible.</strong> Sources, review
              states, exclusions, and denominators stay in view.
            </p>
          </div>
          <Link href="/methodology/" className="text-link">
            The complete methodology <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
