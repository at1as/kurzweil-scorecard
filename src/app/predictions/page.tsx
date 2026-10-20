import { pageMetadata } from "@/lib/site-meta";
import Link from "next/link";
import { predictions } from "@/lib/data";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Scorecard } from "@/components/scorecard";
import { Eyebrow } from "@/components/ui";
export const metadata: Metadata = pageMetadata(
  "/predictions/",
  "The prediction ledger",
  `Search ${predictions.length} selected Ray Kurzweil forecasts by field, deadline and outcome. Read assessments, source links and earlier versions of each record.`,
);
export default function PredictionsPage() {
  return (
    <div className="container page-container predictions-page">
      <div className="page-intro">
        <Eyebrow>THE FORECAST RECORD</Eyebrow>
        <h1>The predictions.</h1>
        <p>
          Search by claim, field or verdict. Open any prediction for our
          judgment and the evidence behind it.
        </p>
      </div>
      <p className="ledger-note">
        A selected collection of {predictions.length} forecast versions. Default
        verdicts reflect our interpretation of each claim.{" "}
        <Link href="/methodology/">Scoring rules & limitations</Link>
      </p>
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
