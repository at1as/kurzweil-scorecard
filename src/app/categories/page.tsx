import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categories, predictions, AS_OF } from "@/lib/data";
import { scorecardUrl } from "@/lib/filters";
import { Eyebrow, SectionHeading } from "@/components/ui";
import { GroupAnalysis } from "@/components/group-analysis";
export const metadata: Metadata = { title: "Category comparisons" };
export default function CategoriesPage() {
  return (
    <div className="container page-container">
      <div className="page-intro">
        <Eyebrow>THE PATTERNS BEHIND THE PREDICTIONS</Eyebrow>
        <h1>Where does the forecast hold up?</h1>
        <p>
          Compare disciplines, decades, forecast horizons, and types of claims.
          <br />
          One primary category per forecast. No extra votes for extra tags.
        </p>
      </div>
      <div className="panel">
        <GroupAnalysis records={predictions} asOf={AS_OF} />
      </div>
      <section className="section">
        <SectionHeading index="01" title="Thirteen lenses on the future.">
          The working taxonomy, with the distinctions each domain requires.
        </SectionHeading>
        <div className="taxonomy-grid">
          {categories.map((c, i) => (
            <article className="taxonomy-card" key={c.name}>
              <div className="card-top">
                <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                <span className="micro-label">
                  {predictions.filter((p) => p.category === c.name).length}{" "}
                  CANDIDATES
                </span>
              </div>
              <h3>
                <Link href={scorecardUrl({ category: c.name })}>
                  {c.name}
                  <ArrowUpRight size={17} />
                </Link>
              </h3>
              <p>{c.rule}</p>
              <div className="tag-list">
                {c.subcategories.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
