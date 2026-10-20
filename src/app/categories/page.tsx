import type { Metadata } from "next";
import Link from "next/link";
import { categories, predictions, AS_OF, AS_OF_LABEL } from "@/lib/data";
import { READINGS, type Reading } from "@/lib/evidence-model";
import { categoryResults, type CategoryResult } from "@/lib/publication";
import { CategoryExplorer } from "@/components/category-explorer";
import { GroupAnalysis } from "@/components/group-analysis";
import { Eyebrow } from "@/components/ui";
export const metadata: Metadata = { title: "Predictions by field" };
export default function CategoriesPage() {
  const names = categories.map((c) => c.name);
  const views = Object.fromEntries(
    READINGS.map((r) => [r, categoryResults(predictions, names, AS_OF, r)]),
  ) as Record<Reading, CategoryResult[]>;
  const commonViews = Object.fromEntries(
    READINGS.map((r) => [
      r,
      categoryResults(predictions, names, AS_OF, r, true),
    ]),
  ) as Record<Reading, CategoryResult[]>;
  return (
    <div className="container page-container publication-page">
      <div className="page-intro editorial-intro">
        <Eyebrow>BY FIELD · {AS_OF_LABEL}</Eyebrow>
        <h1>Where the predictions hold up.</h1>
        <p>
          In our default reading, computing has the most hits, and plenty of
          misses. Networks and medical tools fare better here than robots and
          transport. Read the counts alongside the size of each sample.
        </p>
      </div>
      <CategoryExplorer views={views} commonViews={commonViews} />
      <div className="category-context">
        <h2>A pattern to investigate.</h2>
        <p>
          These groups are uneven and selected, not random samples of everything
          Kurzweil predicted. A field with one assessed forecast tells us about
          that forecast. Future energy predictions say nothing yet about his
          record in energy.
        </p>
        <p>
          Different deadlines and standards of success also matter.{" "}
          <Link href="/methodology/">Read the scoring rules</Link> or select any
          prediction above to inspect its claim and evidence.
        </p>
      </div>
      <details className="editorial-disclosure">
        <summary>
          More breakdowns: decade, forecast horizon & claim type
        </summary>
        <GroupAnalysis records={predictions} asOf={AS_OF} />
      </details>
      <details className="editorial-disclosure">
        <summary>How the {categories.length} categories are defined</summary>
        <div className="taxonomy-definitions">
          {categories.map((c) => (
            <div key={c.name}>
              <h3>{c.name}</h3>
              <p>{c.rule}</p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
