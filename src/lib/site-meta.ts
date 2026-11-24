import type { Metadata } from "next";
import deployment from "../../config/public-site.json";

export const SITE_DESCRIPTION =
  "Compare Ray Kurzweil’s predictions by field and target year, with outcomes and the evidence behind each judgment.";

export function shareCardUrl() {
  return `${deployment.origin}${deployment.basePath}/share-card.png?v=${process.env.PUBLIC_SITE_BUILD_ID ?? "v04-2026-10-15"}`;
}

export function pageMetadata(
  path: string,
  title: string,
  description = SITE_DESCRIPTION,
): Metadata {
  const url = `${deployment.origin}${deployment.basePath}${path}`;
  const image = shareCardUrl();
  const socialTitle =
    path === "/" ? title : `${title} · The Kurzweil Scorecard`;
  const alt =
    "Where was Ray Kurzweil right? Forecast outcomes compared across computing hardware, medicine, and robotics.";
  return {
    title,
    description,
    authors: [{ name: "Jason Willems", url: `${deployment.origin}/` }],
    metadataBase: new URL(deployment.origin),
    alternates: { canonical: url },
    openGraph: {
      title: socialTitle,
      description,
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
      title: socialTitle,
      description,
      creator: "@jasonwillems",
      site: "@jasonwillems",
      images: [{ url: image, alt }],
    },
  };
}

export function structuredData(
  path: string,
  name: string,
  description = SITE_DESCRIPTION,
  dateModified = "2026-10-15",
) {
  const baseUrl = `${deployment.origin}${deployment.basePath}/`;
  const pageUrl = `${deployment.origin}${deployment.basePath}${path}`;
  const breadcrumbs = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${deployment.origin}/`,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Projects",
      item: `${deployment.origin}/sites/`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "The Kurzweil Scorecard",
      item: baseUrl,
    },
    ...(path !== "/"
      ? [
          {
            "@type": "ListItem",
            position: 4,
            name,
            item: pageUrl,
          },
        ]
      : []),
  ];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: path === "/" ? name : `${name} · The Kurzweil Scorecard`,
        description,
        inLanguage: "en",
        dateModified,
        author: {
          "@type": "Person",
          name: "Jason Willems",
          url: `${deployment.origin}/`,
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: shareCardUrl(),
          width: 1200,
          height: 630,
        },
        breadcrumb: { "@id": `${pageUrl}#breadcrumbs` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumbs`,
        itemListElement: breadcrumbs,
      },
    ],
  };
}
