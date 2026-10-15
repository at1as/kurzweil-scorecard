# Ray Kurzweil Prediction Scorecard

A static Next.js site for exploring dated forecasts, their source history, and source-backed editorial assessments.

**Evidence release v0.2, snapshot 2026-10-14:** 88 original leads reconciled; 50 curated forecast/version records; 34 editorial assessments; 13 due-and-eligible assessments. These populations are distinct. This selected subset is not an estimate of Kurzweil’s lifetime accuracy. Judgments are AI-assisted, not human peer review; original book editions were not independently collated.

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

Start with `kurzweil_verification_v0_2/README_AGENT_HANDOFF.md`. The supplied package is immutable, and every manifest hash is checked on import. The original CSV, workbook, and legacy reports also remain unchanged.

- `data/generated/predictions.json`: original 88-row intake with every raw field and source checksum preserved.
- `data/generated/reviewed.json`: 50 records adapted from the authoritative v0.2 package. The complete original object is retained under `release` in each record.
- `src/lib/evidence-model.ts`: package schemas; `src/lib/evidence.ts`: adapter and semantic validation.
- `src/lib/data.ts`: separate curated and original populations, source catalogue, coverage, and reconciliation joins.
- `data/releases/v0.1/`: pre-integration site data and configuration, preserved from commit `74f77b5`.
- `docs/CHANGELOG.md`: dated release and integration history.
- `public/data/releases/`: immutable downloadable snapshots; `public/data/predictions.json` is the current joined dataset.

All 88 original routes remain research-history pages. Every reconciliation is explicit; no automatic redirects are approved. A relationship may mean a split, an unresolved attribution, or a related forecast version rather than a duplicate. In particular, a later 2029 forecast cannot silently replace an unlocated 2019 forecast.

### Rebuild and future corrections

```sh
npm run data:import
npm run check
npm run build
```

Never edit generated JSON, original intake, or the v0.2 package to record new research. Add a new versioned evidence release and a dated change-log entry describing the affected IDs, prior assessment, new assessment, evidence, and rationale. Update the importer’s active-release configuration deliberately and retain previous release files and URLs. Existing v0.1 curation files are retained for historical compatibility; they do not override v0.2 assessments.

The importer validates package integrity, source references, all original mappings, categories, review states, and eligibility before producing release data. Site statistics are recomputed from records, not read from the package’s frozen metrics snapshot. Baseline tests compare recomputed results with the supplied snapshot to detect integration errors.

## Statistical contract

The default deadline cohort follows `eligible_for_deadline_metrics`: 13 assessments, with 2 correct, 6 partial, and 5 wrong/missed. No fractional partial credit. Pending, unreviewed, unscorable, and the qualified K033 hardware-proxy assessment are excluded.

Full realization by review is unknown for nine members of that same cohort, so its percentage is null. Unknown outcomes are not permanent failures. The UI emphasizes outcome counts; it does not rank categories by accuracy or present a whole-career rate. Any exported on-time rate describes only the selected reviewed subset with its explicit denominator.

Supplied verdicts are authoritative editorial judgments, not inferred from dates. `WRONG_MISSED` maps to the existing UI’s `MISSED` key without changing its displayed meaning. `SOURCE_CONFIRMED` remains UNREVIEWED. Secondary-attribution pending cases remain provisional. All claim descriptions are editorial paraphrases, not quotations.

No exact drift observations exist in v0.2. K033 shows **LATE — hardware proxy; approximately 3–4 years**, excluded from default aggregates. A documented-by year is an evidence bound, never a first-achievement year. Chess’s 1997 outcome does not resolve its original deadline. Approximate target intervals are for navigation only.

The snapshot date comes from the release, not the build clock. All 13 original categories remain, including zero-record Manufacturing & materials.

## Pages and interactions

- `/`: separate population counts, outcomes, coverage, timing limitations, and linked comparisons.
- `/predictions/`: curated records by default; Original intake view preserves the original research inventory. Search, combined filters, sorting, pagination, CSV export, and shareable URLs work in the browser.
- `/predictions/K001/` through `/predictions/K050/`: supplied assessments, criteria, attribution, source provenance, separate deadline/review outcomes, limitations, and legacy relations.
- Original `/predictions/AUD-…/`, `/predictions/DEC-…/`, and `/predictions/EXE-…/` routes: unchanged original content plus reconciliation history and related-version links.
- `/categories/`: counts by all 13 categories, target/publication decades, confirmed horizon, and claim type. No accuracy ranking.
- `/sources/`: 32 real source links, 10 coverage entries, provenance limits, original reports, and versioned downloads.
- `/methodology/`: eligibility, uncertainty, editorial review states, date rules, and population limits.

Query parameters: `q`, `category`, `tag`, `source`, `publication`, `target`, `verification`, `verdict`, `type`, `horizon`, `cohort`, `view`, `sort`, `order`, `page`, `size`. `view=intake` selects history; the legacy `view=verified` URL now displays supplied editorial assessments, not a claim of independent verification. Filters combine with AND. CSV exports include every filtered row and escape formula prefixes.

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

Next.js App Router, TypeScript, Tailwind CSS, TanStack Table v8, Zod, Lucide, locally bundled Inter and Newsreader fonts. Charts use accessible HTML/CSS. The hero illustration is conceptual, not observed data.
