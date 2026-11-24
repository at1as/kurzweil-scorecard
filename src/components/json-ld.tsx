import { structuredData } from "@/lib/site-meta";

export function JsonLd({
  path,
  name,
  description,
  dateModified,
}: {
  path: string;
  name: string;
  description?: string;
  dateModified: string;
}) {
  const payload = JSON.stringify(
    structuredData(path, name, description, dateModified),
  ).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
