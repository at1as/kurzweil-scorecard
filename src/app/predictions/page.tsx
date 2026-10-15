import { Suspense } from "react";
import type { Metadata } from "next";
import { Scorecard } from "@/components/scorecard";
import { Eyebrow, Notice } from "@/components/ui";
export const metadata: Metadata = { title: "The prediction ledger" };
export default function PredictionsPage() {
  return (
    <div className="container page-container">
      <div className="page-intro">
        <Eyebrow>THE RESEARCH INTAKE</Eyebrow>
        <h1>The prediction ledger.</h1>
        <p>
          Every claim, its original deadline, and the evidence behind the
          verdict.
          <br />
          Search the collection. Open a record. Follow the research.
        </p>
      </div>
      <Notice>
        <strong>Research in progress.</strong> Imported records start as
        UNREVIEWED. A candidate is never counted as a success or failure until
        its source, criteria, and outcomes have been checked.
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
