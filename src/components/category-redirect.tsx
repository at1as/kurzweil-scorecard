"use client";
import { sitePath } from "@/lib/site-path";
import { useEffect } from "react";

/** Keep older category links, including interpretation choices, useful after consolidation. */
export function CategoryRedirect() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete("cohort");
    const query = params.toString();
    window.location.replace(sitePath(`/${query ? `?${query}` : ""}#by-field`));
  }, []);
  return (
    <a className="text-link" href={sitePath("/#by-field")}>
      Continue to the field comparison →
    </a>
  );
}
