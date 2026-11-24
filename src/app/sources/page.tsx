import { pageMetadata } from "@/lib/site-meta";
import { sitePath } from "@/lib/site-path";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownToLine, BookOpen } from "lucide-react";
import {
  coverage,
  evidenceCoverage,
  evidenceSources,
  AS_OF_LABEL,
  predictions,
  originalIntake,
  release,
  researchSupplement,
} from "@/lib/data";
import { Eyebrow, External, Notice, SectionHeading } from "@/components/ui";

export const metadata: Metadata = pageMetadata(
  "/sources/",
  "Sources",
  "Sources, versioned data releases, coverage notes, and downloadable files behind the Kurzweil Scorecard.",
);

export default function Sources() {
  const legacy = coverage.filter((s) => s.id.startsWith("LEGACY"));
  return (
    <div className="container page-container">
      <div className="page-intro">
        <Eyebrow>THE RESEARCH</Eyebrow>
        <h1>Sources & record history</h1>
        <p>Every cited source, what we checked, and the downloadable datasets.</p>
      </div>
      <Notice>
        <strong>Dataset v{release.id} · {AS_OF_LABEL}.</strong> Covers{" "}
        {predictions.length} reviewed predictions reconciled from{" "}
        {originalIntake.length} initial intake leads. Prior releases (v0.1–v0.3)
        remain archived below.
      </Notice>
      <Notice>
        <strong>Citation supplement · {researchSupplement.checked_at}.</strong>{" "}
        Verified primary section locators and added{" "}
        {researchSupplement.sources.length} corroborating sources while keeping
        the {researchSupplement.outcome_cutoff} outcome cutoff.{" "}
        <a
          href={sitePath("/data/research/citation-supplement-2026-10-18.json")}
          download
        >
          Download the supplement
        </a>
        .
      </Notice>
      <div className="coverage-metrics">
        <div>
          <strong>{originalIntake.length}</strong>
          <span>original leads reconciled</span>
        </div>
        <div>
          <strong>{predictions.length}</strong>
          <span>reviewed predictions</span>
        </div>
        <div>
          <strong>{evidenceSources.length}</strong>
          <span>linked sources</span>
        </div>
        <div>
          <strong>Partial</strong>
          <span>corpus coverage</span>
        </div>
      </div>
      <section className="section">
        <SectionHeading index="01" title="Research coverage">
          This scorecard covers selected passages from Kurzweil’s books, essays,
          and interviews. The main remaining gap is extracting all 147 forecasts
          from the 2009 chapter of <em>The Age of Spiritual Machines</em>.
        </SectionHeading>
        <div className="source-coverage-list">
          {evidenceCoverage.map((s, i) => (
            <article className="coverage-card" key={s.id}>
              <span className="coverage-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="coverage-heading">
                  <h3>{s.source_or_corpus}</h3>
                  <span className="coverage-state">
                    {s.status.replaceAll("_", " ").toLowerCase()}
                  </span>
                </div>
                <p className="coverage-scope">{s.scope_checked}</p>
                <p>
                  <strong>Remaining:</strong> {s.remaining_work}
                </p>
                <p>
                  {s.source_ids.map((id) => (
                    <Link className="source-id-link" key={id} href={`#${id}`}>
                      {id}
                    </Link>
                  ))}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <SectionHeading index="02" title="Source links">
          Forecast attribution and outcome evidence are labeled separately. Page
          locators use printed page numbers rather than PDF viewer indices.
        </SectionHeading>
        <div className="source-coverage-list">
          {evidenceSources.map((s) => (
            <article className="coverage-card" key={s.id} id={s.id}>
              <span className="coverage-index">{s.id}</span>
              <div>
                <div className="coverage-heading">
                  <h3>
                    <External href={s.url}>{s.title}</External>
                  </h3>
                  <span className="coverage-state">
                    {s.kind.replaceAll("_", " ").toLowerCase()}
                  </span>
                </div>
                <p className="coverage-scope">
                  Published: {s.publication_date ?? "not recorded"} · Checked:{" "}
                  {s.checked_as_of} ·{" "}
                  {(s.access_method ?? s.access ?? "not recorded")
                    .replaceAll("_", " ")
                    .toLowerCase()}
                </p>
                {s.provenance_note && <p>{s.provenance_note}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <SectionHeading index="03" title="Where the intake came from">
          Every starting lead is preserved so you can trace how each entry was
          checked, split, or consolidated.
        </SectionHeading>
        <div className="legacy-cards">
          {legacy.map((s) => (
            <article className="panel" key={s.id}>
              <BookOpen size={22} />
              <h3>{s.title}</h3>
              <p>
                <strong>{s.scope}</strong>
              </p>
              <p>{s.notes}</p>
              <code>{s.reference}</code>
            </article>
          ))}
        </div>
        <Link className="text-link" href="/predictions/?view=intake">
          Browse all {originalIntake.length} original intake leads →
        </Link>
      </section>
      <section className="section dataset-section">
        <div>
          <Eyebrow>DATA & HISTORY</Eyebrow>
          <h2>Download the data</h2>
          <p>
            Download the current dataset or inspect any earlier release with its
            original dates, verdicts, and source notes intact.
          </p>
          <div className="hero-actions">
            <a
              className="button button-primary"
              href={sitePath("/data/intake.csv")}
              download
            >
              Original intake CSV <ArrowDownToLine size={16} />
            </a>
            <a
              className="button"
              href={sitePath("/data/predictions.json")}
              download
            >
              Current predictions JSON <ArrowDownToLine size={16} />
            </a>
          </div>
        </div>
        <div className="reference-note">
          <span className="micro-label">VERSIONED RESEARCH DOWNLOADS</span>
          <ul className="question-list">
            {[
              [
                "predictions.canonical.v0.4.json",
                "v0.4 authoritative assessments",
              ],
              [
                "legacy-reconciliation.v0.4.json",
                "All 88 reconciliation decisions (v0.4)",
              ],
              ["sources.v0.4.json", "Source catalog (v0.4)"],
              ["source-coverage.v0.4.json", "Examined scope & remaining work"],
              ["changes.v0.4.csv", "Assessment changes from v0.3"],
              ["metrics.v0.4.json", "v0.4 summary metrics"],
              ["MANIFEST.json", "v0.4 release checksums"],
            ].map(([file, label]) => (
              <li key={`v04-${file}`}>
                <a href={sitePath(`/data/releases/v0.4/${file}`)} download>
                  {label}
                </a>
              </li>
            ))}
            {[
              [
                "predictions.canonical.v0.3.json",
                "v0.3 previous assessments",
              ],
              ["verification-dossiers.v0.3.md", "v0.3 evidence dossiers"],
              [
                "legacy-conditional-outcomes.v0.3.csv",
                "Conditional legacy outcomes",
              ],
            ].map(([file, label]) => (
              <li key={`v03-${file}`}>
                <a href={sitePath(`/data/releases/v0.3/${file}`)} download>
                  {label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={sitePath(
                  "/data/releases/v0.2/predictions.canonical.v0.2.json",
                )}
                download
              >
                v0.2 previous assessments
              </a>
            </li>
            <li>
              <a
                href={sitePath("/data/releases/v0.1/predictions.json")}
                download
              >
                v0.1 original site snapshot
              </a>
            </li>
            <li>
              <a href={sitePath("/data/metrics.json")} download>
                Current summary metrics JSON
              </a>
            </li>
          </ul>
          <Link className="text-link" href="/methodology/">
            Read scope and methodology →
          </Link>
        </div>
      </section>
    </div>
  );
}
