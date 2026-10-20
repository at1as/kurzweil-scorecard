import type { Metadata } from "next";
import { CategoryRedirect } from "@/components/category-redirect";

export const metadata: Metadata = {
  title: "Predictions by field",
  robots: { index: false },
};
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
