"use client";
import { sitePath } from "@/lib/site-path";
import { useEffect } from "react";

/** Keep older category links, including interpretation choices, useful after consolidation. */
export function CategoryRedirect() {
  useEffect(() => {
    window.location.replace(sitePath(`/${window.location.search}#by-field`));
  }, []);
  return (
    <a className="text-link" href={sitePath("/#by-field")}>
      Continue to the field comparison →
    </a>
  );
}
