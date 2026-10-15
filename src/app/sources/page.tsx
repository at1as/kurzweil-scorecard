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
} from "@/lib/data";
import { Eyebrow, External, Notice, SectionHeading } from "@/components/ui";
export const metadata: Metadata = { title: "Sources & research coverage" };
export default function Sources() {
  const legacy = coverage.filter((s) => s.id.startsWith("LEGACY"));
  return (
    <div className="container page-container">
      <div className="page-intro">
        <Eyebrow>THE CORPUS, IN THE OPEN</Eyebrow>
        <h1>A collection, not the complete picture.</h1>
        <p>Source links, what was examined, and what remains to extract.</p>
      </div>
      <Notice>
        <strong>Evidence release v0.2 · {AS_OF_LABEL}.</strong>{" "}
        {release.disclosure} Source confirmation is distinct from outcome
        review. A rebuild does not renew the research date.
      </Notice>
      <div className="coverage-metrics">
        <div>
          <strong>{originalIntake.length}</strong>
          <span>original leads reconciled</span>
        </div>
        <div>
          <strong>{predictions.length}</strong>
          <span>curated forecast/version records</span>
        </div>
        <div>
          <strong>{evidenceSources.length}</strong>
          <span>linked source entries</span>
        </div>
        <div>
          <strong>Open</strong>
          <span>corpus completeness</span>
        </div>
      </div>
      <section className="section">
        <SectionHeading index="01" title="What has actually been examined.">
          Selected passages and versions, not complete book extraction. The
          original 147-item 2009 corpus is the next bounded audit population.
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
        <SectionHeading index="02" title="The source catalogue.">
          Forecast attribution and outcome evidence are labelled separately.
          Locators on detail pages use printed page numbers, not PDF viewer
          indices.
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
                  {s.access.replaceAll("_", " ").toLowerCase()}
                </p>
                {s.provenance_note && <p>{s.provenance_note}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <SectionHeading index="03" title="Where the intake came from.">
          Original reports and their record history remain available. Legacy
          grades are not inherited.
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
          Browse all {originalIntake.length} original leads and reconciliations
          →
        </Link>
      </section>
      <section className="section dataset-section">
        <div>
          <Eyebrow>REPRODUCIBLE BY DESIGN</Eyebrow>
          <h2>Follow the data.</h2>
          <p>
            Immutable releases preserve original dates, prior assessments,
            unresolved cases, and source limitations. The current download
            contains the site’s joined records; original release files remain
            unchanged.
          </p>
          <div className="hero-actions">
            <a
              className="button button-primary"
              href="/data/intake.csv"
              download
            >
              Original intake CSV <ArrowDownToLine size={16} />
            </a>
            <a className="button" href="/data/predictions.json" download>
              Current canonical JSON <ArrowDownToLine size={16} />
            </a>
          </div>
        </div>
        <div className="reference-note">
          <span className="micro-label">VERSIONED RESEARCH DOWNLOADS</span>
          <ul className="question-list">
            {[
              [
                "predictions.canonical.v0.2.json",
                "v0.2 authoritative assessments",
              ],
              [
                "legacy-reconciliation.v0.2.json",
                "All 88 reconciliation decisions",
              ],
              ["sources.v0.2.json", "Source catalogue"],
              ["source-coverage.v0.2.json", "Examined scope & remaining work"],
              ["verification-dossiers.md", "Detailed evidence dossiers"],
              ["MANIFEST.json", "Release file checksums"],
            ].map(([file, label]) => (
              <li key={file}>
                <a href={`/data/releases/v0.2/${file}`} download>
                  {label}
                </a>
              </li>
            ))}
            <li>
              <a href="/data/releases/v0.1/predictions.json" download>
                v0.1 original site snapshot
              </a>
            </li>
            <li>
              <a href="/data/metrics.json" download>
                Recomputed current subset metrics
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
