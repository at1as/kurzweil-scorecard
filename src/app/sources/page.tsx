import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpRight, BookOpen } from "lucide-react";
import { coverage, AS_OF_LABEL, predictions } from "@/lib/data";
import { Eyebrow, External, Notice, SectionHeading } from "@/components/ui";
export const metadata: Metadata = { title: "Sources & research coverage" };
export default function Sources() {
  const primary = coverage.filter((s) => s.id.startsWith("CORPUS"));
  const legacy = coverage.filter((s) => s.id.startsWith("LEGACY"));
  const references = coverage.filter((s) => s.id.startsWith("REFERENCE"));
  return (
    <div className="container page-container">
      <div className="page-intro">
        <Eyebrow>THE CORPUS, IN THE OPEN</Eyebrow>
        <h1>A collection, not the complete picture.</h1>
        <p>
          What has been collected, what has been located,
          <br />
          and what remains to be examined.
        </p>
      </div>
      <Notice>
        <strong>Coverage is not verification.</strong> These states come from
        the supplied workbook as of {AS_OF_LABEL}. A located source is a
        research lead, not proof that its claims or outcomes have been
        independently checked.
      </Notice>
      <div className="coverage-metrics">
        <div>
          <strong>{predictions.length}</strong>
          <span>candidate records imported</span>
        </div>
        <div>
          <strong>{legacy.length}</strong>
          <span>earlier reports preserved</span>
        </div>
        <div>
          <strong>{primary.length}</strong>
          <span>primary corpus entries tracked</span>
        </div>
        <div>
          <strong>Open</strong>
          <span>corpus completeness</span>
        </div>
      </div>
      <section className="section">
        <SectionHeading index="01" title="The primary-source reading list.">
          Books, retrospective reports, wagers, and interviews. Scope and
          extraction status are shown separately.
        </SectionHeading>
        <div className="source-coverage-list">
          {primary.map((s, i) => (
            <article className="coverage-card" key={s.id}>
              <span className="coverage-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="coverage-heading">
                  <h3>{s.title}</h3>
                  <span className="coverage-state">
                    {s.state.toLowerCase()}
                  </span>
                </div>
                <p className="coverage-scope">{s.scope}</p>
                <p>{s.notes}</p>
                <External href={s.reference}>Open source locator</External>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <SectionHeading index="02" title="Where the intake came from.">
          Earlier research is preserved as provenance. Its conclusions are not
          inherited.
        </SectionHeading>
        <div className="legacy-cards">
          {legacy.map((s) => (
            <article className="panel" key={s.id}>
              <BookOpen size={22} />
              <h3>{s.title}</h3>
              <span className="coverage-state">{s.state.toLowerCase()}</span>
              <p>
                <strong>{s.scope}</strong>
              </p>
              <p>{s.notes}</p>
              <code>{s.reference}</code>
              <span className="missing-field">
                Preserved in the repository’s supplied source package
              </span>
            </article>
          ))}
        </div>
      </section>
      <section className="section dataset-section">
        <div>
          <Eyebrow>REPRODUCIBLE BY DESIGN</Eyebrow>
          <h2>Follow the data.</h2>
          <p>
            The raw intake remains unchanged. Normalized records preserve
            provenance, research state, and the original imported fields. No
            Excel formulas run on this site.
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
              Canonical JSON <ArrowDownToLine size={16} />
            </a>
          </div>
        </div>
        <div className="reference-note">
          <span className="micro-label">DESIGN REFERENCE</span>
          {references.map((s) => (
            <div key={s.id}>
              <h3>
                <External href={s.reference}>{s.title}</External>
              </h3>
              <p>{s.notes}</p>
            </div>
          ))}
          <Link href="/methodology/" className="text-link">
            See the scoring methodology <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
