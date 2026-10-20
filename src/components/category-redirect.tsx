"use client";
import { useEffect } from "react";

/** Keep older category links, including interpretation choices, useful after consolidation. */
export function CategoryRedirect() {
  useEffect(() => {
    window.location.replace(`/${window.location.search}#by-field`);
  }, []);
  return (
    <a className="text-link" href="/#by-field">
      Continue to the field comparison →
    </a>
  );
}
