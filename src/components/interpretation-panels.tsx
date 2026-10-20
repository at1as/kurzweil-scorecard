"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Prediction, Verdict } from "@/lib/model";
import { READINGS, READING_LABELS, type Reading } from "@/lib/evidence-model";
import { Badge, External } from "./ui";
import { evidenceSources } from "@/lib/data";
export function InterpretationPanels({ p }: { p: Prediction }) {
  const [mode, setMode] = useState<Reading>("reference");
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("reading");
    if (READINGS.includes(value as Reading)) setMode(value as Reading);
  }, []);
  function changeReading(next: Reading) {
    setMode(next);
    const url = new URL(window.location.href);
    if (next === "reference") url.searchParams.delete("reading");
    else url.searchParams.set("reading", next);
    window.history.replaceState(null, "", url);
  }
  const r = p.release,
    v = r?.interpretations?.[mode];
  if (!v) return null;
  return (
    <section className="detail-section interpretations">
      <h2>Our reading of the claim</h2>
      <div
        className="segmented interpretation-tabs"
        aria-label="Interpretation reading"
      >
        {READINGS.map((m) => (
          <button
            key={m}
            aria-pressed={m === mode}
            onClick={() => changeReading(m)}
          >
            {READING_LABELS[m]}
          </button>
        ))}
      </div>
      <article className="panel interpretation-panel">
        <h3>{READING_LABELS[mode]}</h3>
        <Badge
          verdict={(v.verdict === "WRONG" ? "MISSED" : v.verdict) as Verdict}
        />
        <p>
          <strong>Criterion:</strong> {v.criterion}
        </p>
        <p>
          <strong>Deadline:</strong> {v.deadline_year ?? "Undated"} ·{" "}
          {v.eligible_for_deadline_metrics
            ? "Included in this reading’s mature cohort"
            : "Outside this reading’s mature cohort"}
        </p>
        <div className="outcome-comparison">
          <div>
            <span>At original deadline</span>
            <strong>{v.at_deadline.replaceAll("_", " ")}</strong>
          </div>
          <div>
            <span>By review date</span>
            <strong>{v.at_review.replaceAll("_", " ")}</strong>
          </div>
        </div>
        <p>{v.rationale}</p>
        <details className="editorial-disclosure">
          <summary>Deadline and follow-up notes</summary>
          {v.at_deadline_rationale && (
            <p>
              <strong>At deadline:</strong> {v.at_deadline_rationale}
            </p>
          )}
          {v.at_review_rationale && (
            <p>
              <strong>By review:</strong> {v.at_review_rationale}
            </p>
          )}
        </details>
        {v.relaxed_or_changed_conditions.length > 0 && (
          <div className="notice">
            <div>
              <strong>Changed conditions</strong>
              <ul>
                {v.relaxed_or_changed_conditions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {mode === "broader" && v.relaxed_or_changed_conditions.length > 0 && (
          <p className="footnote">
            Directional success under changed conditions is not full fulfillment
            of the reference criterion.
          </p>
        )}
        {v.verdict === "CORRECT" && v.at_deadline === "NOT_DUE" && (
          <p>
            <strong>EARLY</strong> · Outside deadline-based rates until its
            target cohort matures.
          </p>
        )}
        <p>
          Evidence:{" "}
          {v.evidence_source_ids.map((id) => (
            <span className="source-id-link" key={id}>
              <External href={evidenceSources.find((s) => s.id === id)!.url}>
                {id}
              </External>
            </span>
          ))}
        </p>
        <Link href={`/predictions/?q=${p.id}&reading=${mode}`}>
          View this reading in the scorecard →
        </Link>
      </article>
      {r.non_scoring_comparators?.map((c, i) => (
        <details className="raw-data" key={i}>
          <summary>Non-scoring comparator · excluded from all rates</summary>
          <p>{c.criterion}</p>
          <p>{c.comparator_warning ?? c.warning}</p>
          <p>{c.rationale}</p>
          {c.verdict && (
            <p>
              Comparator assessment: {c.verdict} · {c.at_deadline} /{" "}
              {c.at_review}
            </p>
          )}
          {c.evidence_source_ids?.map((id) => (
            <span className="source-id-link" key={id}>
              <External href={evidenceSources.find((s) => s.id === id)!.url}>
                {id}
              </External>
            </span>
          ))}
        </details>
      ))}
    </section>
  );
}
