import Link from "next/link";
import { allRecords, evidenceSources, release } from "@/lib/data";
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
        {s.access.replaceAll("_", " ").toLowerCase()}
      </p>
      {s.provenance_note && <p>{s.provenance_note}</p>}
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
        <strong>Editorial paraphrase · evidence v0.2.</strong>{" "}
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
      {r.assessment.drift_range_years && (
        <Notice>
          <strong>LATE — hardware proxy; approximately 3–4 years.</strong>{" "}
          {r.assessment.withheld_reason}
        </Notice>
      )}
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
