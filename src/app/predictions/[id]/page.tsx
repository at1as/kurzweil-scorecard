import Link from "next/link";
import { InterpretationPanels } from "@/components/interpretation-panels";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, Check, Minus, FileText } from "lucide-react";
import { predictions, allRecords, AS_OF, AS_OF_LABEL } from "@/lib/data";
import {
  EvidenceContext,
  LegacyRelations,
  SourceProvenance,
} from "@/components/evidence-context";
import { claim, TYPE_LABELS } from "@/lib/model";
import {
  driftLabel,
  driftYears,
  eligibleRecords,
  forecastHorizon,
  verdict,
} from "@/lib/scoring";
import { scorecardUrl } from "@/lib/filters";
import {
  Badge,
  Eyebrow,
  External,
  Notice,
  SectionHeading,
} from "@/components/ui";
export const dynamicParams = false;
export function generateStaticParams() {
  return allRecords.map((p) => ({ id: p.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = allRecords.find((p) => p.id === id);
  return { title: p ? `${id}: ${claim(p)}` : "Prediction not found" };
}
export default async function PredictionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = allRecords.find((p) => p.id === id);
  if (!p) notFound();
  const status = verdict(p, AS_OF);
  const source = p.sources[0];
  const eligible = eligibleRecords(predictions, AS_OF).some(
    (r) => r.id === p.id,
  );
  const related = predictions.filter(
    (other) =>
      other.id !== p.id &&
      ((p.familyId && other.familyId === p.familyId) ||
        other.duplicateOf === p.id ||
        p.duplicateOf === other.id ||
        (p.parentStatementId &&
          other.parentStatementId === p.parentStatementId)),
  );
  const checks = p.release
    ? [
        {
          name: "Text confirmed in listed source",
          done:
            p.release.source_verification.state ===
            "TEXT_CONFIRMED_IN_LISTED_SOURCE",
        },
        {
          name: "Original book edition independently collated",
          done: p.release.publication.original_book_edition_checked,
        },
        {
          name: "Editorial assessment supplied",
          done: ["ASSESSED", "EDITORIAL_ASSESSMENT_COMPLETE"].includes(
            p.release.assessment.review_state,
          ),
        },
        { name: "Eligible for default deadline statistics", done: eligible },
      ]
    : [
        {
          name: "Original wording and attribution",
          done:
            p.wordingKind !== "UNVERIFIED_PARAPHRASE" &&
            p.sources.some((s) => s.wordingVerified),
        },
        {
          name: "Deadline and success criteria",
          done:
            p.deadline.precision !== "UNCONFIRMED" &&
            Boolean(p.successCriteria),
        },
        {
          name: "Outcome evidence reviewed",
          done:
            ["EVIDENCE_CHECKED", "VERIFIED"].includes(p.assessment.state) &&
            p.evidence.length > 0,
        },
        {
          name: "Deduplication / canonical decision",
          done: p.canonical || Boolean(p.duplicateOf),
        },
        {
          name: "Independent assessment complete",
          done: p.assessment.state === "VERIFIED",
        },
      ];
  return (
    <div className="container page-container detail-page">
      <Link className="back-link" href="/predictions/">
        <ArrowLeft size={15} />
        Back to the scorecard
      </Link>
      <div className="detail-intro">
        <Eyebrow>
          {p.id}
          <span className="eyebrow-divider">/</span>
          <Link href={scorecardUrl({ category: p.category })}>
            {p.category}
          </Link>
        </Eyebrow>
        <h1>{claim(p)}</h1>
        <div className="detail-meta">
          {p.reconciliation ? (
            <span className="badge">Legacy lead · see outcome disposition</span>
          ) : (
            <>
              <span className="micro-label">Reference judgment</span>
              <Badge verdict={status} disputed={p.assessment.disputed} />
            </>
          )}
          <span>Research snapshot · {AS_OF_LABEL}</span>
        </div>
      </div>
      {p.release ? (
        <details className="editorial-disclosure detail-research-context">
          <summary>Source confidence & research status</summary>
          <EvidenceContext p={p} />
        </details>
      ) : (
        <EvidenceContext p={p} />
      )}
      {status === "UNREVIEWED" && !p.release && !p.reconciliation && (
        <Notice>
          <strong>This is a research lead.</strong> The imported statement,
          attribution, and target have not completed verification. It is
          excluded from all accuracy statistics.
        </Notice>
      )}
      <div className="detail-grid">
        <div className="detail-main">
          <InterpretationPanels p={p} />
          <section className="detail-section">
            <SectionHeading
              index="01"
              title={
                p.release
                  ? "The forecast and its attribution."
                  : "The original imported lead."
              }
            />
            <div className="quote-panel">
              <span className="micro-label">
                {p.wordingKind === "UNVERIFIED_PARAPHRASE"
                  ? "IMPORTED PARAPHRASE · NOT A VERIFIED QUOTATION"
                  : p.wordingKind.replaceAll("_", " ")}
              </span>
              {p.wordingKind === "VERIFIED_QUOTE" ? (
                <blockquote>{p.originalWording}</blockquote>
              ) : (
                <p className="claim-text">
                  {p.originalWording ?? p.importedClaim}
                </p>
              )}
            </div>
            <div className="source-list">
              {p.sources.map((s) => (
                <div className="source-reference" key={s.id}>
                  <FileText size={19} />
                  <div>
                    <strong>{s.title.replace(/\*/g, "")}</strong>
                    <p>
                      {s.publicationYear ?? "Publication year unknown"} ·{" "}
                      {s.publicationYearVerified
                        ? "Publication year confirmed"
                        : "Attribution / year unconfirmed"}
                      <br />
                      {s.locator ??
                        "Page, edition, or timestamp not yet established"}
                    </p>
                    <SourceProvenance id={s.id} />
                    {s.url ? (
                      <External href={s.url}>Open listed source</External>
                    ) : (
                      <span className="missing-field">
                        No verified source URL recorded
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <dl className="detail-fields">
              <div>
                <dt>Normalized claim</dt>
                <dd>
                  {p.normalizedClaim ??
                    "Not established. The testable claim will be written after the original wording is checked."}
                </dd>
              </div>
              <div>
                <dt>Success criteria</dt>
                <dd>
                  {p.successCriteria ??
                    "Not established. Thresholds, adoption requirements, geography, cost, and required technology must be retained during review."}
                </dd>
              </div>
              <div>
                <dt>Claim type</dt>
                <dd>{TYPE_LABELS[p.claimType]}</dd>
              </div>
              {Object.entries(p.scope)
                .filter(([, value]) => value)
                .map(([key, value]) => (
                  <div key={key}>
                    <dt>{key.replace(/([A-Z])/g, " $1")}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>
          </section>
          <section className="detail-section">
            <SectionHeading index="02" title="Timeline" />
            <div className="timeline">
              <div>
                <span className="timeline-dot" />
                <span className="micro-label">PREDICTION MADE</span>
                <strong>{source.publicationYear ?? "Unknown"}</strong>
                <small>
                  {source.publicationYearVerified
                    ? "Confirmed publication"
                    : p.release
                      ? "Attributed forecast year; original edition not collated"
                      : "Unconfirmed source year"}
                </small>
              </div>
              <div>
                <span className="timeline-dot" />
                <span className="micro-label">ORIGINAL TARGET</span>
                <strong>
                  {p.deadline.exactDate ??
                    p.deadline.year ??
                    p.deadline.originalText}
                </strong>
                <small>
                  {p.deadline.precision === "UNCONFIRMED"
                    ? "No exact deadline used in statistics"
                    : "Deadline supplied by this assessment"}
                </small>
              </div>
              <div>
                <span className="timeline-dot" />
                <span className="micro-label">FULL REALIZATION</span>
                <strong>
                  {p.assessment.firstAchievementYear ??
                    (p.release?.assessment.full_achievement_documented_by_year
                      ? `By ${p.release.assessment.full_achievement_documented_by_year}`
                      : "—")}
                </strong>
                <small>
                  {p.assessment.firstAchievementYear
                    ? `Drift: ${driftLabel(driftYears(p, AS_OF))}`
                    : p.release?.assessment.full_achievement_documented_by_year
                      ? "Evidence bound, not first achievement year"
                      : "No achievement year established"}
                </small>
              </div>
            </div>
            {p.release?.timing && (
              <p className="timing-note">
                <strong>{p.release.timing.kind.replaceAll("_", " ")}:</strong>{" "}
                {p.release.timing.label ||
                  (p.assessment.atReview !== "FULL" && eligible
                    ? `Overdue; not fully realized as of ${AS_OF}`
                    : "No first-achievement date established.")}
              </p>
            )}
            {p.release?.target.interpretation && (
              <p className="footnote">{p.release.target.interpretation}</p>
            )}
            <div className="outcome-comparison">
              <div>
                <span>Outcome at original deadline</span>
                <strong>
                  {(
                    p.release?.assessment.at_deadline ?? p.assessment.atDeadline
                  ).replaceAll("_", " ")}
                </strong>
              </div>
              <div>
                <span>Outcome at review</span>
                <strong>
                  {(
                    p.release?.assessment.at_review ?? p.assessment.atReview
                  ).replaceAll("_", " ")}
                </strong>
              </div>
            </div>
            <p className="footnote">
              Supplied target wording: {p.deadline.originalText}.{" "}
              {p.deadline.precision === "UNCONFIRMED"
                ? "No confirmed date is used in calculations."
                : "The original deadline is preserved if a later forecast revises it."}{" "}
              Forecast horizon:{" "}
              {forecastHorizon(p) === null
                ? "not established"
                : `${forecastHorizon(p)} years`}
              . Drift is a calendar-year difference, not a precise elapsed
              duration.
            </p>
          </section>
          <section className="detail-section">
            <SectionHeading index="03" title="The evidence." />
            {p.evidence.length ? (
              <div className="evidence-list">
                {p.evidence.map((e) => (
                  <article key={e.id}>
                    <span className="micro-label">
                      {e.stance} ·{" "}
                      {e.publishedAt ?? "Publication date not recorded"}
                    </span>
                    <h3>
                      <External href={e.url}>{e.title}</External>
                    </h3>
                    <p>{e.note}</p>
                    <small>Source checked as of {e.accessedAt}</small>
                    {p.release && (
                      <SourceProvenance
                        id={
                          e.sourceId ??
                          p.release.evidence[p.evidence.indexOf(e)]
                            ?.source_id ??
                          ""
                        }
                      />
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="evidence-empty">
                <FileText size={24} />
                <h3>No outcome evidence has been verified.</h3>
                <p>
                  Legacy ratings are preserved in the source package. They have
                  not been accepted as evidence for this assessment.
                </p>
              </div>
            )}
            <h3 className="subheading">Capability, adoption, and timing</h3>
            <p>
              A related breakthrough is not automatically fulfillment. Review
              must check the actual capability, how widely it was required to be
              used, the specified technology, and the original deadline. A
              prototype cannot establish a claim about routine or widespread
              use.
            </p>
            {p.assessment.alternativeInterpretation && (
              <Notice>
                <strong>Alternative interpretation:</strong>{" "}
                {p.assessment.alternativeInterpretation}
              </Notice>
            )}
          </section>
          <section className="detail-section">
            <SectionHeading index="04" title="Research notes & history" />
            <p>{p.research.notes}</p>
            <LegacyRelations p={p} />
            {p.research.unresolvedQuestions.length > 0 && (
              <>
                <h3 className="subheading">Open questions</h3>
                <ul className="question-list">
                  {p.research.unresolvedQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </>
            )}
            <dl className="provenance-fields">
              <div>
                <dt>Imported from</dt>
                <dd>
                  {p.provenance.inputFile}
                  {p.provenance.row ? ` · CSV row ${p.provenance.row}` : ""}
                </dd>
              </div>
              <div>
                <dt>Legacy identifier</dt>
                <dd>{p.provenance.legacyId ?? "None"}</dd>
              </div>
              <div>
                <dt>Forecast family</dt>
                <dd>{p.familyId ?? "Not assigned"}</dd>
              </div>
              <div>
                <dt>Parent statement</dt>
                <dd>{p.parentStatementId ?? "Not assigned"}</dd>
              </div>
              <div>
                <dt>File checksum</dt>
                <dd className="checksum">
                  {p.provenance.inputSha256 || "Not recorded"}
                </dd>
              </div>
            </dl>
            <details className="raw-data">
              <summary>Inspect preserved source fields</summary>
              <dl>
                {Object.entries(p.provenance.raw).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{value || "(blank)"}</dd>
                  </div>
                ))}
              </dl>
            </details>
            {p.research.history.length > 0 && (
              <div>
                <h3 className="subheading">Review history</h3>
                {p.research.history.map((h, i) => (
                  <p key={i}>
                    <time>{h.date}</time> — {h.note}
                  </p>
                ))}
              </div>
            )}
          </section>
          <section className="detail-section">
            <SectionHeading title="Related forecasts." />
            {related.length ? (
              related.map((other) => (
                <Link
                  className="related-row"
                  key={other.id}
                  href={`/predictions/${other.id}/`}
                >
                  <span className="mono">{other.id}</span>
                  {claim(other)}
                  <ArrowUpRight size={16} />
                </Link>
              ))
            ) : (
              <p className="muted">
                No forecast family has been resolved for this record. Related
                statements and revised deadlines will be linked during research.
              </p>
            )}
          </section>
        </div>
        <aside className="assessment-panel">
          <Eyebrow>REFERENCE JUDGMENT</Eyebrow>
          {p.reconciliation ? (
            <span className="badge">Legacy lead · see outcome disposition</span>
          ) : (
            <Badge verdict={status} disputed={p.assessment.disputed} />
          )}
          <p>
            {p.assessment.rationale ??
              "The original source and outcome have not been verified. No accuracy judgment has been assigned."}
          </p>
          <dl>
            <div>
              <dt>Review state</dt>
              <dd>{p.assessment.state.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Outcome confidence</dt>
              <dd>{p.assessment.confidence ?? "Not assessed"}</dd>
            </div>
            <div>
              <dt>Last reviewed</dt>
              <dd>{p.assessment.lastReviewedAt ?? "Not yet reviewed"}</dd>
            </div>
            <div>
              <dt>Reviewer</dt>
              <dd>{p.assessment.reviewer ?? "Not assigned"}</dd>
            </div>
            <div>
              <dt>In selected due denominator</dt>
              <dd>{eligible ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt>Curated forecast version</dt>
              <dd>{p.canonical ? "Yes" : "No"}</dd>
            </div>
          </dl>
          {p.assessment.exclusionReason && (
            <p>
              <strong>Exclusion:</strong> {p.assessment.exclusionReason}
            </p>
          )}
          <h3>Source & review checklist</h3>
          <ul className="checklist">
            {checks.map((check) => (
              <li key={check.name}>
                {check.done ? <Check size={16} /> : <Minus size={16} />}
                <span>{check.name}</span>
                <span className="sr-only">
                  {check.done ? "Complete" : "Incomplete"}
                </span>
              </li>
            ))}
          </ul>
          <Link className="text-link" href="/methodology/">
            Understand the rubric <ArrowUpRight size={14} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
