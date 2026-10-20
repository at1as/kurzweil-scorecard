# Ray Kurzweil Prediction Scorecard

A static Next.js site for exploring dated forecasts, their source history, and source-backed editorial assessments.

**Evidence release v0.3, snapshot 2026-10-15:** 88 original leads reconciled; 84 curated forecast/version records (34 new); 68 mature reference forecasts with both deadline and review outcomes assessed; 14 future and two undated records. These populations are distinct. This selected subset is not an estimate of Kurzweil’s lifetime accuracy. Judgments are AI-assisted, not human peer review; original book editions were not independently collated.

## Run locally

Requires Node.js 22+ and Python 3 (standard library only). Switch Node versions with `nvm use` if needed.

```sh
npm ci
npm run data:import
npm run dev
```

Open the Local URL printed by Next.js, normally http://127.0.0.1:3000. No API keys, database, authentication, or paid backend is required. Fonts are bundled locally.

```sh
npm run check     # integrity, schema, TypeScript, and unit tests
npm run build     # deterministic import and static route generation
npm run preview   # serve out/ at http://127.0.0.1:3000
```

`PORT=4100 npm run preview` selects another port. `next start` does not serve this static-export configuration.

## Evidence and history

Start with `kurzweil_verification_v0_3_package/README_AGENT_HANDOFF.md`. The dated citation supplement in `data/research/citation-supplement-2026-10-18.json` resolves all 15 blank locators and adds five corroborating primary sources, without changing the imported judgments. The supplied package is immutable, and every manifest hash is checked on import. The original CSV, workbook, and legacy reports also remain unchanged.

- `data/generated/predictions.json`: original 88-row intake with every raw field and source checksum preserved.
- `data/generated/reviewed.json`: 84 records adapted from the authoritative v0.3 package. The complete original object is retained under `release` in each record.
- `src/lib/evidence-model.ts`: package schemas; `src/lib/evidence.ts`: adapter and semantic validation.
- `src/lib/data.ts`: separate curated and original populations, source catalogue, coverage, and reconciliation joins.
- `data/releases/v0.1/`: pre-integration site data and configuration, preserved from commit `74f77b5`.
- `data/releases/v0.2/`: frozen pre-v0.3 site data, metrics, and configuration.
- `data/research/`: validated, dated supplements applied to the browsing/evidence projection; raw release payloads remain unchanged.
- `docs/CHANGELOG.md`: dated release and integration history.
- `public/data/releases/`: immutable downloadable snapshots; `public/data/predictions.json` is the current joined dataset.

All 88 original routes remain research-history pages. Every reconciliation is explicit; no automatic redirects are approved. A relationship may mean a split, an unresolved attribution, or a related forecast version rather than a duplicate. In particular, a later 2029 forecast cannot silently replace an unlocated 2019 forecast.

### Rebuild and future corrections

```sh
npm run data:import
npm run check
npm run build
```

Never edit generated JSON, original intake, or either evidence package to record new research. Add a new versioned evidence release and a dated change-log entry describing the affected IDs, prior assessment, new assessment, evidence, and rationale. Update the importer’s active-release configuration deliberately and retain previous release files and URLs. Existing v0.1 curation files are retained for historical compatibility; they do not override versioned evidence assessments.

The importer validates package integrity, source references, all original mappings, categories, review states, and eligibility before producing release data. Site statistics are recomputed from records, not read from the package’s frozen metrics snapshot. Baseline tests compare recomputed results with the supplied snapshot to detect integration errors.

## Statistical contract

Reference is the stated reasonable reading. The native mature cohort contains 68 records: 25 fulfilled on time (36.8%) and 36 fully realized by review (52.9%). The all-record reference distribution includes 26 correct, 11 late, 17 partial, 16 wrong, and 14 pending; the extra correct and partial records are undated and earn no deadline credit. These are selected-subset results, not lifetime accuracy.

Each record contains reference, strict/alternative, and broader interpretations, with separate criteria, original deadline outcomes, review outcomes, explanations, and eligibility. Strict/alternative is not always uniformly harsher: K036 permits a 2026 deadline, making its native mature cohort 67. Mode-comparison tables use the intersection of all three eligible cohorts (67), and drill down to those exact IDs. Broader readings disclose changed mechanism/adoption conditions. A future broader success can be marked EARLY without entering mature rates.

Partials earn no half-points. Conditional legacy assessments (46 rows) and stronger-than-source comparators never enter author metrics. All 88 original dispositions remain available, including component outcomes for multi-target imports. Supplied verdicts are used directly; `WRONG` maps to the existing UI key `MISSED`. All 84 canonical records have completed editorial assessments; attribution, outcome, and timing confidence remain separate.

Timing has exact-event, documented-by, editorial-era-bound, and unestablished types. Chess retains its −3 to −1 year drift range. K033 now uses the supplied measured 2013 performance milestone, 4 years late under the reference criterion. Known-by and approximate dates are never converted into invented first-achievement dates. Unfulfilled due records show overdue status at the release cutoff. Prior v0.2 judgments remain in record history and immutable downloads.

The research snapshot is 2026-10-15 regardless of build time. All 13 original categories remain. See `docs/V03_INTEGRATION_REVIEW.md` for package checks and remaining research gaps.

## Pages and interactions

- `/`: a narrative introduction, outcome summaries and all 13 fields in one expandable comparison. Squares preview the claim on hover/focus and open evidence in a side panel. Field rows open into prediction tables; future and undated records stay outside the score. Interpretation and common-population choices survive reloads. Further breakdowns and category definitions are collapsed below the chart.
- `/predictions/`: curated records by default; Original intake view preserves the original research inventory. The default table shows four columns; “Show research columns” restores all nine. Prediction links open the same evidence panel while filters, sorting and pagination stay in place. Search, combined filters, CSV export, and shareable URLs work in the browser.
- `/predictions/K001/` through `/predictions/K084/`: supplied assessments, criteria, attribution, source provenance, separate deadline/review outcomes, limitations, and legacy relations.
- Original `/predictions/AUD-…/`, `/predictions/DEC-…/`, and `/predictions/EXE-…/` routes: unchanged original content plus reconciliation history and related-version links.
- `/categories/`: compatibility route to `/#by-field`, retaining query parameters. The comparison is now part of the homepage.
- `/sources/`: 103 live source links (98 imported plus five supplemental), 5 incremental source-coverage entries, provenance limits, original reports, and versioned downloads.
- `/methodology/`: eligibility, uncertainty, editorial review states, date rules, and population limits.

Evidence panels show the selected judgment, criterion, deadline/review outcomes and named source links. Source notes and the original attribution expand in place. Close, Escape, backdrop click or Back return to the originating row; Forward reopens the panel. On mobile the panel fills the screen. Full records and assessment history remain available through an explicit link and normal modified-click behavior. `evidence=K002&evidenceReading=strict` opens a panel on the current page without changing its `reading` filter. Summary JSON is generated at build time under `/evidence/<id>/summary.json` and loaded on demand; no server is required.

Query parameters: `q`, `category`, `tag`, `source`, `publication`, `target`, `verification`, `verdict`, `type`, `horizon`, `cohort`, `reading`, `view`, `sort`, `order`, `page`, `size`. `reading=reference|strict|broader` selects the outcome interpretation. `cohort=common` selects the equal 67-record comparison; `on-time`, `realized`, `new`, and `undated` identify contributing populations. `view=intake` selects history; the legacy `view=verified` URL now displays supplied editorial assessments, not a claim of independent verification. Filters combine with AND. CSV exports include every filtered row and escape formula prefixes.

## Verification

```sh
npm run check
npm run build
npx playwright install chromium   # first use
npm run test:browser
```

The browser suite starts the production preview on port 4100. It checks populated subset counts, filters, sorting, pagination, exports, clipboard, history routes, source links, qualified timing, category coverage, accessibility, and mobile layout. Screenshots/traces go to ignored `work/`. Use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium` for an existing compatible browser.

## Static deployment

The site already uses Next.js static export. `npm run build` generates `out/`; building does not publish it. Deploy its contents at a domain root on a host with directory index support, trailing-slash URLs, and `404.html` handling. No SPA catch-all rewrite or application server is needed. Search and charts remain interactive; data changes require rebuilding.

A hosted build needs Node 22+ and Python 3. Alternatively, run the importer locally and use `npx next build` on a host without Python. Repository-subpath hosting needs Next.js `basePath` and adjustments to plain absolute data-download links before building.

## Implementation

Next.js App Router, TypeScript, Tailwind CSS, TanStack Table v8, Zod, Lucide, locally bundled Inter and Newsreader fonts. Charts use accessible HTML/CSS; the evidence panel uses a native modal dialog.
