import Link from "next/link";
import { ModeComparison } from "@/components/mode-comparison";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  BookOpen,
  CheckCheck,
  ScanText,
} from "lucide-react";
import {
  AS_OF,
  AS_OF_LABEL,
  categories,
  predictions,
  originalIntake,
  release,
} from "@/lib/data";
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
  const featured = ["K002", "K024", "K033"]
    .map((id) => predictions.find((p) => p.id === id))
    .filter((p) => p !== undefined);
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <Eyebrow>
            <span className="live-dot" />A living research project{" "}
            <span className="eyebrow-divider">/</span> Edition 03
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
          <Link className="metric" href={scorecardUrl({ view: "intake" })}>
            <span>Original leads reconciled</span>
            <strong>
              {originalIntake.length}
              <ArrowUpRight size={23} />
            </strong>
            <p>Original wording and routes preserved</p>
          </Link>
          <Link className="metric" href="/predictions/">
            <span>Curated forecast/version records</span>
            <strong>{stats.collected}</strong>
            <p>A selected collection, not a lifetime total</p>
          </Link>
          <Link className="metric" href={scorecardUrl({ view: "verified" })}>
            <span>Editorial assessments</span>
            <strong>{stats.verified}</strong>
            <p>Deadline and review outcomes recorded</p>
          </Link>
          <Link className="metric" href={scorecardUrl({ cohort: "eligible" })}>
            <span>Due forecasts assessed</span>
            <strong>{stats.eligible}</strong>
            <p>Eligible for the default deadline subset</p>
          </Link>
        </div>
        <Notice>
          <strong>Selected reviewed subset only.</strong> These results are not
          an estimate of Kurzweil’s lifetime accuracy. {release.disclosure}{" "}
          <Link href="/methodology/">Read the scope and exclusions.</Link>
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
          The status counts above cover all {stats.collected} source-matched
          versions. The mature reference cohort contains{" "}
          {stats.eligibleBreakdown.CORRECT} correct,{" "}
          {stats.eligibleBreakdown.LATE} late, {stats.eligibleBreakdown.PARTIAL}{" "}
          partial, and {stats.eligibleBreakdown.MISSED} wrong assessments. Two
          undated records are outside deadline-based rates.
        </p>
        <div className="coverage-metrics">
          <div>
            <Link href={scorecardUrl({ cohort: "on-time" })}>
              <strong>{(stats.onTimeRate! * 100).toFixed(1)}%</strong>
              <span>
                Reference on-time rate · {stats.onTime} / {stats.eligible}
              </span>
            </Link>
          </div>
          <div>
            <Link href={scorecardUrl({ cohort: "realized" })}>
              <strong>{(stats.realizationRate! * 100).toFixed(1)}%</strong>
              <span>
                Full realization by review · {stats.realized} / {stats.eligible}
              </span>
            </Link>
          </div>
          <div>
            <Link href={scorecardUrl({ cohort: "new" })}>
              <strong>
                {predictions.filter((p) => p.release?.is_new_in_v03).length}
              </strong>
              <span>New forecast versions in v0.3</span>
            </Link>
          </div>
          <div>
            <Link href={scorecardUrl({ view: "future" })}>
              <strong>
                {
                  predictions.filter(
                    (p) => p.release?.assessment.at_deadline === "NOT_DUE",
                  ).length
                }
              </strong>
              <span>Future targets · current outcomes assessed</span>
            </Link>
          </div>
        </div>
        <p className="footnote">
          Rates describe this selected reference subset (n={stats.eligible}).
          Partials receive no fractional credit.{" "}
          <Link href={scorecardUrl({ cohort: "undated" })}>
            Inspect the two undated outcomes.
          </Link>
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
                {predictions.length} CURATED RECORDS
              </span>
            </div>
            <BarChart
              items={domains.slice(0, 7)}
              filter="category"
              total={predictions.length}
              label="Curated records by category"
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
              label="Curated records by target decade"
              color="sand"
            />
            <p className="chart-caption">
              Grouped from supplied target wording. Ambiguous or multi-decade
              targets stay unresolved. No deadline has been inferred for
              scoring.
            </p>
          </article>
        </div>
      </section>
      <section className="section">
        <SectionHeading index="03" title="Outcomes, with their limits.">
          Deadline outcomes and review outcomes remain separate. Small selected
          groups do not support an accuracy ranking.
        </SectionHeading>
        <div className="chart-grid">
          <article className="panel">
            <div className="panel-heading">
              <h3>Verdict distribution</h3>
              <span className="micro-label">n = {stats.verified} ASSESSED</span>
            </div>
            <VerdictChart records={predictions} asOf={AS_OF} />
          </article>
          <article className="panel">
            <div className="panel-heading">
              <h3>Timing drift</h3>
              <span className="micro-label">DATES, BOUNDS & RANGES</span>
            </div>
            <DriftChart records={predictions} asOf={AS_OF} />
          </article>
        </div>
        <ModeComparison records={predictions} asOf={AS_OF} />
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
                <div>
                  <Badge verdict={verdict(p, AS_OF)} />
                  {p.release?.assessment.verdict_qualifier && (
                    <small className="qualifier">
                      {p.release.assessment.verdict_qualifier.replaceAll(
                        "_",
                        " ",
                      )}
                    </small>
                  )}
                </div>
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
