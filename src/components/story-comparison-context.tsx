"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { READINGS, type Reading } from "@/lib/evidence-model";
import type { CategoryResult } from "@/lib/publication";

type Comparison = {
  reading: Reading;
  common: boolean;
  rows: CategoryResult[];
  commonCount: number;
  update: (reading: Reading, common: boolean) => void;
};
const ComparisonContext = createContext<Comparison | null>(null);

export function StoryComparisonProvider({
  views,
  commonViews,
  children,
}: {
  views: Record<Reading, CategoryResult[]>;
  commonViews: Record<Reading, CategoryResult[]>;
  children: ReactNode;
}) {
  const [reading, setReading] = useState<Reading>("reference");
  const [common, setCommon] = useState(false);
  useEffect(() => {
    function readUrl() {
      const params = new URLSearchParams(window.location.search);
      const value = params.get("reading");
      setReading(
        READINGS.includes(value as Reading) ? (value as Reading) : "reference",
      );
      setCommon(params.get("cohort") === "common");
    }
    readUrl();
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  }, []);
  function update(nextReading: Reading, nextCommon: boolean) {
    setReading(nextReading);
    setCommon(nextCommon);
    const url = new URL(window.location.href);
    if (nextReading === "reference") url.searchParams.delete("reading");
    else url.searchParams.set("reading", nextReading);
    if (nextCommon) url.searchParams.set("cohort", "common");
    else url.searchParams.delete("cohort");
    window.history.replaceState(null, "", url);
  }
  return (
    <ComparisonContext.Provider
      value={{
        reading,
        common,
        update,
        rows: (common ? commonViews : views)[reading],
        commonCount: commonViews.reference.reduce(
          (sum, row) => sum + row.due,
          0,
        ),
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}
export function useStoryComparison() {
  const comparison = useContext(ComparisonContext);
  if (!comparison)
    throw Error("Story comparisons need StoryComparisonProvider");
  return comparison;
}
