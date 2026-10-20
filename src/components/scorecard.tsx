"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import {
  Search,
  SlidersHorizontal,
  Download,
  Link2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpRight,
} from "lucide-react";
import {
  AS_OF,
  categories,
  predictions,
  allRecords,
  originalIntake,
} from "@/lib/data";
import {
  claim,
  CLAIM_TYPES,
  LABELS,
  REVIEW_STATES,
  TYPE_LABELS,
  VERDICTS,
  type Prediction,
} from "@/lib/model";
import { driftLabel, driftYears, verdict } from "@/lib/scoring";
import {
  defaultFilters,
  exportCsv,
  filterRecords,
  parseFilters,
  publicationDecade,
  serializeFilters,
  sortValue,
  targetDecade,
  VIEWS,
  type Filters,
} from "@/lib/filters";
import {
  deadlineOutcome,
  reviewOutcome,
  displayOutcome,
} from "@/lib/interpretations";
import { READING_LABELS, READINGS } from "@/lib/evidence-model";
import { Badge } from "./ui";
const VIEW_LABELS = {
  all: "Curated records",
  intake: "Original intake",
  verified: "Assessed",
  fulfilled: "Fulfilled",
  misses: "Misses",
  future: "Future targets",
};
const unique = (items: string[]) => [...new Set(items)].sort();
function cleanSource(value: string) {
  return value.replace(/\*/g, "").replace(/【[^】]*】/g, "");
}
export function Scorecard() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = useMemo(
    () => parseFilters(new URLSearchParams(search.toString())),
    [search],
  );
  const population = filters.view === "intake" ? originalIntake : predictions;
  const [more, setMore] = useState(false);
  const [researchColumns, setResearchColumns] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  function update(values: Partial<Filters>, resetPage = true) {
    const current = parseFilters(new URLSearchParams(window.location.search));
    const next = { ...current, ...values, ...(resetPage ? { page: 1 } : {}) };
    const query = serializeFilters(next);
    window.history.replaceState(
      null,
      "",
      `${pathname}${query ? `?${query}` : ""}`,
    );
  }
  const filtered = useMemo(
    () => filterRecords(allRecords, filters, AS_OF),
    [filters],
  );
  const columns = useMemo<ColumnDef<Prediction>[]>(
    () => [
      {
        id: "prediction",
        header: "Prediction",
        accessorFn: (p) => sortValue(p, "prediction", AS_OF),
        cell: ({ row }) => (
          <Link
            href={`/predictions/${row.original.id}/`}
            className="prediction-cell"
          >
            <span className="row-id">{row.original.id}</span>
            <strong>{claim(row.original)}</strong>
            <span className="row-source">
              {cleanSource(row.original.sources[0].title)}
            </span>
          </Link>
        ),
      },
      {
        id: "category",
        header: "Category",
        accessorFn: (p) => p.category,
        cell: ({ row }) => (
          <span className="category-cell">{row.original.category}</span>
        ),
      },
      {
        id: "made",
        header: "Prediction made",
        accessorFn: (p) => sortValue(p, "made", AS_OF),
        sortUndefined: "last",
        cell: ({ row }) => (
          <span className="year-cell">
            {row.original.sources[0].publicationYear ?? "—"}
            <small>
              {row.original.sources[0].publicationYearVerified
                ? "Confirmed"
                : "Unconfirmed"}
            </small>
          </span>
        ),
      },
      {
        id: "target",
        header: "Target year",
        accessorFn: (p) => sortValue(p, "target", AS_OF),
        sortUndefined: "last",
        cell: ({ row }) => (
          <span className="year-cell">
            {row.original.deadline.exactDate ??
              row.original.deadline.year ??
              row.original.deadline.originalText}
            <small>
              {row.original.deadline.precision === "UNCONFIRMED"
                ? "Unconfirmed"
                : "Supplied reading year"}
            </small>
          </span>
        ),
      },
      {
        id: "verdict",
        header: "Verdict",
        accessorFn: (p) => verdict(p, AS_OF),
        cell: ({ row }) => (
          <div>
            {row.original.reconciliation ? (
              <span className="badge">
                {row.original.reconciliation.conditional_outcome?.verdict?.replaceAll(
                  "_",
                  " ",
                ) ?? "Linked / component outcomes"}
                <small className="qualifier">
                  Conditional legacy disposition
                </small>
              </span>
            ) : (
              <Badge
                verdict={verdict(row.original, AS_OF)}
                disputed={row.original.assessment.disputed}
              />
            )}
            {row.original.release?.assessment.verdict_qualifier && (
              <small className="qualifier">
                {row.original.release.assessment.verdict_qualifier.replaceAll(
                  "_",
                  " ",
                )}
              </small>
            )}
            {row.original.release?.source_verification.state.startsWith(
              "REPORTED_ATTRIBUTION",
            ) && (
              <small className="qualifier">
                Provisional secondary attribution
              </small>
            )}
          </div>
        ),
      },
      {
        id: "atDeadline",
        header: "At original deadline",
        accessorFn: (p) => deadlineOutcome(p),
        cell: ({ row }) => (
          <span className="outcome-cell">
            {displayOutcome(deadlineOutcome(row.original))}
          </span>
        ),
      },
      {
        id: "atReview",
        header: "By review date",
        accessorFn: (p) => reviewOutcome(p),
        cell: ({ row }) => (
          <span className="outcome-cell">
            {displayOutcome(reviewOutcome(row.original))}
          </span>
        ),
      },
      {
        id: "actual",
        header: "Actual year",
        accessorFn: (p) => sortValue(p, "actual", AS_OF),
        sortUndefined: "last",
        cell: ({ row }) => (
          <span className="numeric">
            {row.original.assessment.firstAchievementYear ?? "—"}
          </span>
        ),
      },
      {
        id: "drift",
        header: "Timing / known by",
        accessorFn: (p) => sortValue(p, "drift", AS_OF),
        sortUndefined: "last",
        cell: ({ row }) => (
          <span className="numeric">
            {row.original.release?.timing?.label ||
              driftLabel(driftYears(row.original, AS_OF))}
          </span>
        ),
      },
    ],
    [],
  );
  const effectivePage = Math.min(
    filters.page - 1,
    Math.max(0, Math.ceil(filtered.length / filters.size) - 1),
  );
  const sorting: SortingState = [
    { id: filters.sort, desc: filters.order === "desc" },
  ];
  const pagination: PaginationState = {
    pageIndex: effectivePage,
    pageSize: filters.size,
  };
  const table = useReactTable({
    data: filtered,
    columns,
    autoResetPageIndex: false,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      pagination,
      columnVisibility: {
        made: researchColumns,
        atDeadline: researchColumns,
        atReview: researchColumns,
        actual: researchColumns,
        drift: researchColumns,
      },
    },
    enableSortingRemoval: false,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      update({
        sort: (next[0]?.id ?? "prediction") as Filters["sort"],
        order: next[0]?.desc ? "desc" : "asc",
      });
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(pagination) : updater;
      update({ page: next.pageIndex + 1, size: next.pageSize }, false);
    },
  });
  const activeKeys = (
    [
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
    ] as const
  ).filter((key) => filters[key]);
  function download() {
    const csv = exportCsv(
      table.getPrePaginationRowModel().rows.map((row) => row.original),
      AS_OF,
    );
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `kurzweil-selection-${AS_OF}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus("View link copied");
    } catch {
      setCopyStatus("Copy this view’s URL from your address bar");
    }
    setTimeout(() => setCopyStatus(""), 4000);
  }
  const select = (
    key: keyof Filters,
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <label className="filter-label">
      {label}
      <select
        aria-label={label}
        value={String(filters[key])}
        onChange={(e) => update({ [key]: e.target.value })}
      >
        <option value="">All {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
  const opts = (items: string[]) =>
    items.map((value) => ({ value, label: value }));
  return (
    <div className="scorecard">
      <div className="ledger-controls">
        <label className="inline-select reading-control">
          Interpretation
          <select
            aria-label="Interpretation"
            value={filters.reading}
            onChange={(e) =>
              update({ reading: e.target.value as Filters["reading"] })
            }
          >
            {READINGS.map((mode) => (
              <option key={mode} value={mode}>
                {READING_LABELS[mode]}
              </option>
            ))}
          </select>
        </label>
        <button
          className="text-button"
          aria-pressed={researchColumns}
          onClick={() => setResearchColumns(!researchColumns)}
        >
          {researchColumns ? "Hide research columns" : "Show research columns"}
        </button>
      </div>
      {filters.reading !== "reference" && (
        <p className="table-note">
          {filters.reading === "strict"
            ? "Alternative criteria can change the population or deadline, not just the severity of a judgment."
            : "Broader outcomes can use a different mechanism or lower adoption threshold. Open a record to see the changed conditions."}
        </p>
      )}
      <div className="view-tabs" role="group" aria-label="Prediction views">
        {VIEWS.map((view) => (
          <button
            key={view}
            aria-pressed={filters.view === view}
            onClick={() => update({ view })}
          >
            {VIEW_LABELS[view]}
            {view === "all" && <span>{predictions.length}</span>}
            {view === "intake" && <span>{originalIntake.length}</span>}
          </button>
        ))}
      </div>
      <div className="filter-panel">
        <div className="search-row">
          <label className="search-box">
            <Search size={18} />
            <span className="sr-only">Search predictions</span>
            <input
              type="search"
              placeholder="Search predictions, technologies, sources…"
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
            />
            {filters.q && (
              <button
                onClick={() => update({ q: "" })}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </label>
          <button
            className={`button button-small ${more ? "selected" : ""}`}
            onClick={() => setMore(!more)}
            aria-expanded={more}
            aria-controls="advanced-filters"
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeKeys.length > 0 && (
              <span className="filter-count">{activeKeys.length}</span>
            )}
          </button>
        </div>
        <div className="primary-filters">
          {select(
            "category",
            "Categories",
            opts(categories.map((c) => c.name)),
          )}
          {select(
            "verdict",
            "Verdicts",
            VERDICTS.map((value) => ({ value, label: LABELS[value] })),
          )}
          {select(
            "source",
            "Sources",
            unique(
              population.flatMap((p) => p.sources.map((s) => s.title)),
            ).map((value) => ({ value, label: cleanSource(value) })),
          )}
        </div>
        <div id="advanced-filters" className="advanced-filters" hidden={!more}>
          {select(
            "tag",
            "Subcategories",
            opts(unique(population.flatMap((p) => p.tags))),
          )}
          {select(
            "publication",
            "Publication decades",
            opts(unique(population.map(publicationDecade))),
          )}
          {select(
            "target",
            "Target decades",
            opts(unique(population.map(targetDecade))),
          )}
          {select(
            "verification",
            "Verification states",
            opts([...REVIEW_STATES]),
          )}
          {select(
            "type",
            "Prediction types",
            CLAIM_TYPES.map((value) => ({ value, label: TYPE_LABELS[value] })),
          )}
          {select("cohort", "Statistical populations", [
            { value: "eligible", label: "Due & eligible selected subset" },
            { value: "canonical", label: "Canonical only" },
            { value: "common", label: "Common 67-record comparison cohort" },
            { value: "new", label: "New in v0.3" },
            { value: "undated", label: "No usable deadline" },
            { value: "on-time", label: "Eligible and fulfilled on time" },
            {
              value: "realized",
              label: "Eligible and fully realized by review",
            },
            { value: "drift", label: "Eligible with exact timing drift" },
          ])}
        </div>
        {activeKeys.length > 0 && (
          <div className="active-filters">
            {activeKeys.map((key) => (
              <button key={key} onClick={() => update({ [key]: "" })}>
                {key}: {String(filters[key])}
                <X size={12} />
                <span className="sr-only">Remove filter</span>
              </button>
            ))}
            <button
              className="clear-filters"
              onClick={() => router.replace(pathname, { scroll: false })}
            >
              Clear all
            </button>
          </div>
        )}
      </div>
      <div className="results-toolbar">
        <p role="status" aria-live="polite">
          <strong>{filtered.length}</strong> of {population.length} records
          <span> · Snapshot {AS_OF}</span>
        </p>
        <div>
          <span className="copy-status" aria-live="polite">
            {copyStatus}
          </span>
          <button className="text-button" onClick={copy}>
            <Link2 size={15} />
            Share view
          </button>
          <button
            className="text-button"
            onClick={download}
            disabled={filtered.length === 0}
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>
      {filters.view === "intake" && (
        <p className="table-note">
          Research history: all original leads remain unchanged and unscored.
          Open a record for its reconciliation, related versions, and reasons.
          Links do not imply equivalence.
        </p>
      )}
      {filters.view === "future" && (
        <p className="table-note">
          Future targets are navigation labels. Pending assessments may still
          have provisional secondary attribution; none enters the deadline
          denominator.
        </p>
      )}
      <div className="table-scroll scorecard-table-wrap">
        <table
          className={`scorecard-table ${researchColumns ? "research-table" : "concise-table"}`}
        >
          <caption className="sr-only">
            Prediction scorecard. Click a prediction to inspect its evidence.
            Sorting buttons are in column headings.
          </caption>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : "none"
                    }
                  >
                    <button onClick={header.column.getToggleSortingHandler()}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getIsSorted() === "asc" ? (
                        <ArrowUp size={12} />
                      ) : header.column.getIsSorted() === "desc" ? (
                        <ArrowDown size={12} />
                      ) : (
                        <ArrowUpDown size={12} />
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.original.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="no-results">
            <Search size={25} />
            <h3>
              {filters.q || activeKeys.length || filters.view === "all"
                ? "No matching records."
                : "No records in this view yet."}
            </h3>
            <p>
              {filters.view === "all"
                ? "Try a broader search or remove a filter."
                : "Try another view or remove a filter. Original leads remain available in Original intake."}
            </p>
            <button
              className="button button-small"
              onClick={() => router.replace(pathname, { scroll: false })}
            >
              Show curated records <ArrowUpRight size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="pagination">
        <div>
          {filtered.length
            ? `${effectivePage * filters.size + 1}–${Math.min((effectivePage + 1) * filters.size, filtered.length)}`
            : "0"}{" "}
          of {filtered.length} records
        </div>
        <label>
          Rows per page
          <select
            aria-label="Rows per page"
            value={filters.size}
            onChange={(e) => update({ size: Number(e.target.value) })}
          >
            {[15, 30, 60, 100].map((size) => (
              <option value={size} key={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="pagination-controls">
          <button
            aria-label="Previous page"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft size={17} />
          </button>
          <span>
            Page {effectivePage + 1} of {Math.max(1, table.getPageCount())}
          </span>
          <button
            aria-label="Next page"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <p className="footnote">
        Publication years are attributed to the listed source; original editions
        were not independently collated. The selected subset is not a lifetime
        accuracy estimate. A blank actual year or drift means the required
        evidence has not been established. Exports include all filtered records,
        not just this page.
      </p>
    </div>
  );
}
