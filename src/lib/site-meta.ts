import type { Metadata } from "next";
import deployment from "../../config/public-site.json";

export const SITE_DESCRIPTION =
  "Compare Ray Kurzweil’s predictions by field and target year, with outcomes and the evidence behind each judgment.";

export function pageMetadata(path: string, title: string): Metadata {
  const url = `${deployment.origin}${deployment.basePath}${path}`;
  const image = `${deployment.origin}${deployment.basePath}/share-card.png?v=${process.env.PUBLIC_SITE_BUILD_ID ?? "v03-2026-10-15"}`;
  const alt =
    "Where was Ray Kurzweil right? Forecast outcomes compared across computing hardware, medicine and robotics.";
  return {
    title,
    description: SITE_DESCRIPTION,
    metadataBase: new URL(deployment.origin),
    alternates: { canonical: url },
    openGraph: {
      title,
      description: SITE_DESCRIPTION,
      url,
      type: "website",
      siteName: "The Kurzweil Scorecard",
      locale: "en_US",
      images: [
        { url: image, width: 1200, height: 630, type: "image/png", alt },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: SITE_DESCRIPTION,
      creator: "@jasonwillems",
      site: "@jasonwillems",
      images: [{ url: image, alt }],
    },
  };
}
