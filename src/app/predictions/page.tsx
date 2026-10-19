import { Suspense } from "react";
import type { Metadata } from "next";
import { Scorecard } from "@/components/scorecard";
import { Eyebrow, Notice } from "@/components/ui";
export const metadata: Metadata = { title: "The prediction ledger" };
export default function PredictionsPage() {
  return (
    <div className="container page-container predictions-page">
      <div className="page-intro">
        <Eyebrow>THE FORECAST RECORD</Eyebrow>
        <h1>The prediction ledger.</h1>
        <p>
          Every claim, its original deadline, and the evidence behind the
          verdict.
          <br />
          Search the collection. Open a record. Follow the research.
        </p>
      </div>
      <Notice>
        <strong>Selected reviewed subset only.</strong> Source-backed editorial
        assessments are AI-assisted, not human peer review or a lifetime
        accuracy estimate. Original leads remain available in the Original
        intake view.
      </Notice>
      <Suspense
        fallback={
          <div className="loading-state">Loading the prediction ledger…</div>
        }
      >
        <Scorecard />
      </Suspense>
    </div>
  );
}
