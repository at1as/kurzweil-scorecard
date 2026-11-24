import { pageMetadata } from "@/lib/site-meta";
import Link from "next/link";
import { AS_OF, categories, originalIntake, predictions } from "@/lib/data";
import { toLedgerRecord } from "@/lib/ledger-data";
import type { Metadata } from "next";
import { Scorecard } from "@/components/scorecard";
import { JsonLd } from "@/components/json-ld";
import { Eyebrow } from "@/components/ui";

const DESCRIPTION = `Search ${predictions.length} Ray Kurzweil forecasts by field, deadline, and outcome. Inspect our judgments, evidence, and source links for every record.`;

export const metadata: Metadata = pageMetadata(
  "/predictions/",
  "All predictions",
  DESCRIPTION,
);

export default function PredictionsPage() {
  const leanPredictions = predictions.map(toLedgerRecord);
  const leanIntake = originalIntake.map(toLedgerRecord);
  const categoryNames = categories.map((c) => c.name);
  return (
    <div className="container page-container predictions-page">
      <JsonLd
        path="/predictions/"
        name="All predictions"
        description={DESCRIPTION}
        dateModified={AS_OF}
      />
      <div className="page-intro">
        <Eyebrow>THE FULL LIST</Eyebrow>
        <h1>All predictions</h1>
        <p>
          Search by claim, field, or verdict. Select any prediction to read the
          judgment and the evidence behind it, or review{" "}
          <Link href="/methodology/">how we score them</Link>.
        </p>
      </div>
      <Scorecard
        records={leanPredictions}
        intake={leanIntake}
        categoryNames={categoryNames}
        asOf={AS_OF}
      />
    </div>
  );
}
