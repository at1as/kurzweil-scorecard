import type { Metadata } from "next";
import deployment from "../../config/public-site.json";
export function pageMetadata(path: string, title: string): Metadata {
  const url = `${deployment.origin}${deployment.basePath}${path}`;
  return {
    title,
    alternates: { canonical: url },
    openGraph: {
      title,
      url,
      type: "website",
      siteName: "The Kurzweil Scorecard",
    },
    twitter: { card: "summary", title },
  };
}
