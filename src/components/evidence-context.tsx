import Link from "next/link";
import {
  allRecords,
  evidenceSources,
  release,
  researchSupplement,
} from "@/lib/data";
import type { Prediction } from "@/lib/model";
import { Notice, External } from "./ui";
export function SourceProvenance({ id }: { id: string }) {
  const s = evidenceSources.find((s) => s.id === id);
  if (!s) return null;
  return (
    <div className="source-provenance">
      <span className="micro-label">{s.kind.replaceAll("_", " ")}</span>
      <p>
        Source publication: {s.publication_date ?? "not recorded"} · Access:{" "}
        {(s.access_method ?? s.access ?? "not recorded")
          .replaceAll("_", " ")
          .toLowerCase()}
      </p>
      {s.provenance_note && <p>{s.provenance_note}</p>}
      {researchSupplement.citations.some((c) => c.source_id === id) &&
        s.checked_as_of !== researchSupplement.checked_at && (
          <p>
            Section locator and support checked {researchSupplement.checked_at}{" "}
            in the citation supplement.
          </p>
        )}
      <Link href={`/sources/#${s.id}`}>Catalogue entry {s.id}</Link>
    </div>
  );
}
export function EvidenceContext({ p }: { p: Prediction }) {
  const m = p.reconciliation,
    r = p.release;
  if (m)
    return (
      <section className="reconciliation-panel">
        <Notice>
          <strong>Original intake · research history.</strong> This lead is
          preserved as imported. It is not scored or redirected.{" "}
          <strong>{m.action.replaceAll("_", " ")}</strong>
          <p>{m.reason}</p>
        </Notice>
        <ConditionalOutcomes p={p} />
        {m.canonical_ids.length > 0 && (
          <div className="history-links">
            <h2>Reconciled records & related versions</h2>
            <p>
              A link can identify a related version, split claim, or unresolved
              attribution; it does not establish equivalence.
            </p>
            {m.canonical_ids.map((id) => (
              <Link
                className="related-row"
                key={id}
                href={`/predictions/${id}/`}
              >
                <span className="mono">{id}</span>
                {allRecords.find((x) => x.id === id)?.release?.title ?? id}
              </Link>
            ))}
          </div>
        )}
        <p className="footnote">
          Disposition sources:{" "}
          {m.source_ids.map((id) => (
            <Link key={id} href={`/sources/#${id}`}>
              {id}{" "}
            </Link>
          ))}
        </p>
      </section>
    );
  if (!r) return null;
  return (
    <div className="release-context">
      <Notice>
        <strong>Editorial paraphrase · evidence v0.3.</strong>{" "}
        {release.disclosure}
        <p>
          Source state: {r.source_verification.state.replaceAll("_", " ")}.{" "}
          {r.source_verification.state.startsWith("REPORTED_ATTRIBUTION") && (
            <strong>
              Provisional secondary attribution; original transcript not
              checked.
            </strong>
          )}
        </p>
        {r.assessment.review_state === "SOURCE_CONFIRMED" && (
          <p>
            Source confirmation is not completed outcome review. This record
            remains UNREVIEWED.
          </p>
        )}
      </Notice>
      <dl className="detail-fields confidence-fields">
        <div>
          <dt>Attribution confidence</dt>
          <dd>{r.attribution_confidence}</dd>
        </div>
        <div>
          <dt>Outcome confidence · deadline / review</dt>
          <dd>
            {r.outcome_confidence?.at_deadline} /{" "}
            {r.outcome_confidence?.at_review}
          </dd>
        </div>
        <div>
          <dt>Timing confidence / kind</dt>
          <dd>
            {r.timing_confidence} · {r.timing?.kind.replaceAll("_", " ")}
          </dd>
        </div>
        <div>
          <dt>Population</dt>
          <dd>{r.population_scope}</dd>
        </div>
      </dl>
    </div>
  );
}
export function LegacyRelations({ p }: { p: Prediction }) {
  if (!p.release?.legacy_relations.length) return null;
  return (
    <div className="history-links">
      <h3 className="subheading">Original leads & relationship history</h3>
      <p>
        Original routes and wording are retained. Related versions do not
        replace an earlier unlocated forecast.
      </p>
      {p.release.legacy_relations.map((rel) => (
        <div key={rel.legacy_id}>
          <Link className="related-row" href={`/predictions/${rel.legacy_id}/`}>
            <span className="mono">{rel.legacy_id}</span>
            {rel.relation.replaceAll("_", " ")}
          </Link>
        </div>
      ))}
    </div>
  );
}

function ConditionalOutcomes({ p }: { p: Prediction }) {
  const c = p.reconciliation?.conditional_outcome;
  if (!c) return null;
  const conditional =
    c.assessment_basis ===
    "CONDITIONAL_ON_IMPORTED_WORDING_NOT_VERIFIED_ATTRIBUTION";
  return (
    <div className="panel conditional-outcomes">
      <h2>
        {conditional
          ? "Attribution unresolved — outcome conditional on this wording"
          : "Outcome dispositions on the corrected source-matched criteria"}
      </h2>
      <p>{c.assessed_claim}</p>
      {c.verdict && (
        <p>
          <strong>Conditional verdict: {c.verdict.replaceAll("_", " ")}</strong>
        </p>
      )}
      {c.at_deadline && (
        <p>
          At original deadline: {c.at_deadline.replaceAll("_", " ")} · By
          review: {c.at_review?.replaceAll("_", " ")}
        </p>
      )}
      <p>{c.rationale}</p>
      {c.date_note && <p>{c.date_note}</p>}
      {c.broader_reading && <p>{c.broader_reading}</p>}
      {c.component_assessments.map((v, i) => (
        <article className="interpretation-panel" key={i}>
          <h3>{v.title ?? v.claim}</h3>
          <p>Target: {v.deadline ?? "see linked record"}</p>
          <p>
            {v.verdict} · At deadline: {v.at_deadline.replaceAll("_", " ")} · By
            review: {v.at_review.replaceAll("_", " ")}
          </p>
          <p>{v.qualifier}</p>
          {v.id && <Link href={`/predictions/${v.id}/`}>{v.id} →</Link>}
        </article>
      ))}
      <p className="footnote">
        Excluded from aggregate author accuracy. Conditional wording and related
        canonical versions are never counted twice.
      </p>
      {c.evidence_source_ids?.map((id) => (
        <Link className="source-id-link" key={id} href={`/sources/#${id}`}>
          {id}
        </Link>
      ))}
    </div>
  );
}
