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
  rows: CategoryResult[];
  update: (reading: Reading) => void;
};
const ComparisonContext = createContext<Comparison | null>(null);

export function StoryComparisonProvider({
  views,
  children,
}: {
  views: Record<Reading, CategoryResult[]>;
  children: ReactNode;
}) {
  const [reading, setReading] = useState<Reading>("reference");
  useEffect(() => {
    function readUrl() {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const value = params.get("reading");
      setReading(
        READINGS.includes(value as Reading) ? (value as Reading) : "reference",
      );
      // Retire old Story cohort links without changing evidence or reading state.
      if (params.has("cohort")) {
        params.delete("cohort");
        window.history.replaceState(window.history.state, "", url);
      }
    }
    readUrl();
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  }, []);
  function update(nextReading: Reading) {
    setReading(nextReading);
    const url = new URL(window.location.href);
    if (nextReading === "reference") url.searchParams.delete("reading");
    else url.searchParams.set("reading", nextReading);
    url.searchParams.delete("cohort");
    window.history.replaceState(window.history.state, "", url);
  }
  return (
    <ComparisonContext.Provider
      value={{
        reading,
        update,
        rows: views[reading],
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
