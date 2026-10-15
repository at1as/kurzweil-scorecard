import { claim, type Prediction } from "./model";
import {
  canonicalRecords,
  deadlineYear,
  driftYears,
  eligibleRecords,
  forecastHorizon,
  isVerified,
  verdict,
} from "./scoring";
export const VIEWS = [
  "all",
  "verified",
  "fulfilled",
  "misses",
  "future",
] as const;
export type View = (typeof VIEWS)[number];
export const SORTS = [
  "prediction",
  "category",
  "made",
  "target",
  "verdict",
  "actual",
  "drift",
] as const;
export type Filters = {
  q: string;
  category: string;
  tag: string;
  source: string;
  publication: string;
  target: string;
  verification: string;
  verdict: string;
  type: string;
  horizon: string;
  cohort: string;
  view: View;
  sort: (typeof SORTS)[number];
  order: "asc" | "desc";
  page: number;
  size: number;
};
export const defaultFilters: Filters = {
  q: "",
  category: "",
  tag: "",
  source: "",
  publication: "",
  target: "",
  verification: "",
  verdict: "",
  type: "",
  horizon: "",
  cohort: "",
  view: "all",
  sort: "prediction",
  order: "asc",
  page: 1,
  size: 15,
};
export function parseFilters(params: URLSearchParams): Filters {
  const f = { ...defaultFilters };
  for (const key of [
    "q",
    "category",
    "tag",
    "source",
    "publication",
    "target",
    "verification",
    "verdict",
    "type",
    "horizon",
    "cohort",
  ] as const)
    f[key] = (params.get(key) ?? "").slice(0, 1000);
  const view = params.get("view");
  if (VIEWS.includes(view as View)) f.view = view as View;
  const sort = params.get("sort");
  if (SORTS.includes(sort as Filters["sort"])) f.sort = sort as Filters["sort"];
  f.order = params.get("order") === "desc" ? "desc" : "asc";
  const page = Number(params.get("page"));
  if (Number.isSafeInteger(page) && page > 0) f.page = Math.min(page, 100000);
  const size = Number(params.get("size"));
  if ([15, 30, 60, 100].includes(size)) f.size = size;
  return f;
}
export function serializeFilters(filters: Filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value !== defaultFilters[key as keyof Filters])
      params.set(key, String(value));
  return params.toString();
}
export function scorecardUrl(filters: Partial<Filters> = {}) {
  const query = serializeFilters({ ...defaultFilters, ...filters });
  return `/predictions/${query ? `?${query}` : ""}`;
}
export function decade(year: number | null) {
  return year === null ? "Unresolved" : `${Math.floor(year / 10) * 10}s`;
}
export function targetDecade(p: Prediction) {
  if (p.deadline.precision !== "UNCONFIRMED") return decade(deadlineYear(p));
  // Browse provisional labels only. Never convert these values into confirmed deadlines.
  const years = p.deadline.originalText.match(/\d{4}/g)?.map(Number) ?? [];
  const values = [...new Set(years.map(decade))];
  return values.length === 1 ? values[0] : "Unresolved";
}
export function publicationDecade(p: Prediction) {
  const confirmed = p.sources.find(
    (s) => s.publicationYearVerified && s.publicationYear !== null,
  );
  const source =
    confirmed ??
    (p.assessment.state === "VERIFIED"
      ? undefined
      : p.sources.find((s) => s.publicationYear !== null));
  return decade(source?.publicationYear ?? null);
}
export function horizonGroup(p: Prediction) {
  const h = forecastHorizon(p);
  return h === null
    ? "Unresolved"
    : h < 10
      ? "0–9 years"
      : h < 20
        ? "10–19 years"
        : h < 30
          ? "20–29 years"
          : "30+ years";
}
export function futureCandidate(p: Prediction, asOf: string) {
  if (p.deadline.precision !== "UNCONFIRMED")
    return p.deadline.exactDate
      ? p.deadline.exactDate >= asOf
      : (p.deadline.year ?? 0) >= Number(asOf.slice(0, 4));
  const years = p.deadline.originalText.match(/\d{4}/g)?.map(Number) ?? [];
  return years.length > 0 && Math.min(...years) > Number(asOf.slice(0, 4));
}
export function filterRecords(
  records: Prediction[],
  filters: Filters,
  asOf: string,
) {
  const eligible = new Set(eligibleRecords(records, asOf).map((p) => p.id));
  const canonical = new Set(canonicalRecords(records).map((p) => p.id));
  const words = filters.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return records.filter((p) => {
    const v = verdict(p, asOf);
    if (filters.view === "verified" && !isVerified(p, asOf)) return false;
    if (filters.view === "fulfilled" && !["CORRECT", "LATE"].includes(v))
      return false;
    if (filters.view === "misses" && v !== "MISSED") return false;
    if (filters.view === "future" && !futureCandidate(p, asOf)) return false;
    if (filters.category && p.category !== filters.category) return false;
    if (filters.tag && !p.tags.includes(filters.tag)) return false;
    if (filters.source && !p.sources.some((s) => s.title === filters.source))
      return false;
    if (filters.publication && publicationDecade(p) !== filters.publication)
      return false;
    if (filters.target && targetDecade(p) !== filters.target) return false;
    if (filters.verification && p.assessment.state !== filters.verification)
      return false;
    if (filters.verdict && v !== filters.verdict) return false;
    if (filters.type && p.claimType !== filters.type) return false;
    if (filters.horizon && horizonGroup(p) !== filters.horizon) return false;
    if (filters.cohort === "eligible" && !eligible.has(p.id)) return false;
    if (filters.cohort === "canonical" && !canonical.has(p.id)) return false;
    if (
      filters.cohort === "drift" &&
      (!canonical.has(p.id) || driftYears(p, asOf) === null)
    )
      return false;
    const haystack = [
      p.id,
      p.importedClaim,
      p.originalWording,
      p.normalizedClaim,
      p.category,
      p.tags.join(" "),
      p.sources.map((s) => s.title).join(" "),
      p.deadline.originalText,
      p.research.notes,
    ]
      .join(" ")
      .toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
export function sortValue(
  p: Prediction,
  key: Filters["sort"],
  asOf: string,
): string | number | undefined {
  switch (key) {
    case "prediction":
      return claim(p);
    case "category":
      return p.category;
    case "made":
      return p.sources[0].publicationYear ?? undefined;
    case "target":
      return (
        deadlineYear(p) ??
        (Number(p.deadline.originalText.match(/\d{4}/)?.[0]) || undefined)
      );
    case "verdict":
      return verdict(p, asOf);
    case "actual":
      return p.assessment.firstAchievementYear ?? undefined;
    case "drift":
      return driftYears(p, asOf) ?? undefined;
  }
}
export function exportCsv(records: Prediction[], asOf: string) {
  const header = [
    "ID",
    "Prediction (editorial/imported)",
    "Category",
    "Tags",
    "Claimed source",
    "Publication year",
    "Publication year verified",
    "Target text",
    "Confirmed deadline",
    "Verdict",
    "Verification",
    "Canonical",
    "At deadline",
    "At review",
    "Actual year",
    "Drift years",
    "Review date",
    "Source URLs",
    "Evidence URLs",
    "Provenance file",
    "Provenance row",
    "Snapshot date",
  ];
  const escape = (value: unknown) => {
    const text = String(value ?? "");
    return (
      '"' +
      (/^[\s]*[=+\-@]/.test(text) ? "'" + text : text).replaceAll('"', '""') +
      '"'
    );
  };
  return [
    header,
    ...records.map((p) => [
      p.id,
      claim(p),
      p.category,
      p.tags.join("; "),
      p.sources.map((s) => s.title).join("; "),
      p.sources[0].publicationYear,
      p.sources[0].publicationYearVerified,
      p.deadline.originalText,
      p.deadline.exactDate ?? p.deadline.year,
      verdict(p, asOf),
      p.assessment.state,
      p.canonical,
      p.assessment.atDeadline,
      p.assessment.atReview,
      p.assessment.firstAchievementYear,
      driftYears(p, asOf),
      p.assessment.lastReviewedAt,
      p.sources
        .map((s) => s.url)
        .filter(Boolean)
        .join("; "),
      p.evidence.map((e) => e.url).join("; "),
      p.provenance.inputFile,
      p.provenance.row,
      asOf,
    ]),
  ]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");
}
