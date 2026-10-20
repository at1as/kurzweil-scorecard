import { pageMetadata } from "@/lib/site-meta";
import type { Metadata } from "next";
import { CategoryRedirect } from "@/components/category-redirect";

export const metadata: Metadata = pageMetadata("/", "How the fields compare");
export default function CategoriesPage() {
  return (
    <div className="container page-container">
      <div className="page-intro">
        <h1>The comparison is now part of the story.</h1>
        <CategoryRedirect />
      </div>
    </div>
  );
}
