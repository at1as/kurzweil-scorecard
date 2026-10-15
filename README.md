# Ray Kurzweil Prediction Scorecard

An evidence-based audit of technological forecasting. A complete static Next.js application for browsing a growing research dataset, with source-traceable statistics and explicit verification gates.

**Release scope:** website and data infrastructure. The supplied 88 candidates remain UNREVIEWED. This is not a completed historical audit, an exhaustive prediction corpus, or a claim of any accuracy percentage. No legacy score has been promoted into a verified outcome.

## Run locally

Requires Node.js 22+ and Python 3 (standard library only). If your default Node is older, switch versions first (`nvm use` with the included `.nvmrc`).

```sh
npm ci
npm run data:import
npm run dev
```

Open the Local URL printed by Next.js, normally http://127.0.0.1:3000. The app has no API keys, database, authentication, or paid backend requirements. Fonts are bundled locally; the site does not fetch Google Fonts at runtime or build time.

```sh
npm run check     # dataset validation, strict TypeScript, unit tests
npm run build     # re-imports data and generates all routes in out/
npm run preview   # serves the production export at http://127.0.0.1:3000
```

`PORT=4100 npm run preview` uses a different local port. `next start` does not serve this static-export configuration.

## Pages and interactions

- `/`: overview, verification progress, category coverage, target distributions, verdicts, timing drift, and automatically enabled accuracy analytics.
- `/predictions/`: searchable TanStack table with sorting, pagination, combined filters, five views, CSV export, and shareable URL state.
- `/predictions/AUD-001/` (and every other stable ID): original/imported wording, source attribution, criteria, timelines, evidence, research checklist, related forecasts, and unmodified import provenance.
- `/categories/`: primary-category, target-decade, publication-decade, confirmed forecast-horizon, and claim-type comparisons.
- `/methodology/`: definitions, denominators, date rules, duplicates, disputes, and research limitations.
- `/sources/`: workbook source inventory and downloads of the original intake and normalized canonical JSON.

Query parameters include `q`, `category`, `tag`, `source`, `publication`, `target`, `verification`, `verdict`, `type`, `horizon`, `cohort`, `view`, `sort`, `order`, `page`, and `size`. Filters combine with AND; full-text words also combine with AND. The CSV export includes the entire filtered selection in the current sort order, not just the visible page. Spreadsheet-formula prefixes in exported text are neutralized.

## Deploy

The site is **ready to deploy**; building does not publish it or create a hosting account.

### Vercel

Import this directory as a Git repository into Vercel. Use Node 22+, install with `npm ci`, and build with `npm run build`. The Next.js preset understands `output: "export"`; the generated static output directory is `out`. The build environment needs Python 3 for the workbook-specification extraction step. If your host does not include Python, run `npm run data:import` locally and commit the generated data, then use `npx next build` as the host build command.

### Other static hosts

Build locally and publish the contents of `out/` to a host supporting directory index files. All record URLs are pre-rendered as `predictions/<ID>/index.html`; use trailing-slash URLs. Serve `404.html` for unknown paths. No catch-all SPA rewrite is required. Deploy at a domain root; configure Next.js `basePath` before building if you need a repository subpath.

## Data workflow

Original input files and the supplied `kurzweil_scorecard_v0_1_package/` are preserved unchanged. Do not edit them to record new research.

1. `data/config.json` sets the dataset snapshot, input filenames, and expected original intake count. The first snapshot is **2026-10-13**, inherited from the workbook; it is not the build date.
2. `scripts/extract-workbook.py` reads the workbook ZIP/XML with Python's standard library. It extracts taxonomy, rubric, coverage, and data dictionary into `data/generated/specification.json` and records the workbook SHA-256. It does not evaluate Excel formulas.
3. `scripts/import-data.ts` parses the original CSV (including its BOM and quoting), preserves **every original field**, row number, legacy ID, and input checksum, and constructs the typed canonical records. No numerical endpoint is inferred from provisional target text.
4. `data/curated/overrides.json` applies explicit editorial updates to existing intake records. Each entry is `{ "id": "AUD-001", "changes": { ... } }`. Changes are shallow: replace a whole nested object such as `assessment` or `deadline`. Stable IDs, original imported claims, and provenance cannot be overwritten through overrides.
5. `data/curated/predictions.json` holds full canonical objects for genuinely new research records. Both curated files start empty.
6. Validation runs before writing `data/generated/predictions.json` and `public/data/predictions.json`. Duplicate IDs or scoring keys, invalid dates, incomplete verification, and inconsistent outcomes fail the import/build.

After an edit, run `npm run data:import`, then `npm run check`, then `npm run build`. Do not edit generated files by hand. A fresh build repeats the import deterministically. Static pages and client-side analytics all consume the same generated dataset.

### Add a verified prediction without changing UI code

Use the full model in `src/lib/model.ts` and the field guide in `docs/DATA_MODEL.md`. For an existing candidate, copy the relevant nested structures from its generated JSON into an override and complete them using actual source research. For a new prediction, add a complete object to `data/curated/predictions.json`, with a new stable ID and real provenance.

A verified, scorable record needs:

- Checked original wording, a normalized claim, and fixed full success criteria.
- At least one original source with a real HTTP(S) URL, page/paragraph/timestamp locator, and `wordingVerified: true`.
- A confirmed original deadline with explicit precision. Publication years remain provisional unless separately checked.
- Independent, dated outcome-evidence references and separate deadline/review outcomes.
- A review date no later than the snapshot, reviewer, confidence, and written rationale.
- `canonical: true` and a unique `scoringKey` only after deduplication. A family ID relates revisions; it is not itself a deduplication key.
- `state: "VERIFIED"`, `scorable: true`, and the appropriate outcomes. A future target uses `atDeadline: "NOT_DUE"`; due targets require a completed assessment after the deadline.

Actual-achievement dates are nullable even for full outcomes; unknown dates leave drift unavailable. Unmet claims cannot have achievement dates. The verdict is derived, never manually entered. Once a verified, due, canonical, scorable record is present, the same dashboard, analytics, filters, and pages automatically show its results. Synthetic fixtures exist only under `tests/`; they are never imported into the site.

### Correct, deduplicate, revise, or exclude

- Correct editorial fields through an override and add an entry to `research.history` with the date and explanation. Keep the raw source text intact.
- For duplicate mentions, set `duplicateOf` to a retained original ID, set `canonical: false`, and supply `assessment.exclusionReason`. Do not delete historical records to improve the score.
- A genuinely revised deadline is a new record with its own ID/scoring key and the same family ID. Preserve the original record and deadline.
- For misattributions/non-predictions, set the state to `EXCLUDED` and record why. Records remain available under the excluded filter.
- New curated records can be removed from the curated file and rebuilt, but published research corrections should normally use an explicit exclusion to preserve audit history and stable URLs.

## Statistical contract

Strict accuracy is full at original deadline / verified, canonical, due, scorable forecasts. Full realization uses **the same denominator** and counts full at deadline or by review. No fractional partial credit. Future deadlines are excluded from both rates, including early successes. A zero-sized denominator is null and displays “Not yet available.”

Year deadlines close after December 31. Exact dates close after the stated day. The 2026-10-13 snapshot therefore excludes whole-year 2026 deadlines. At-deadline outcomes cannot be rewritten by later achievement. Only full, verified outcomes with known achievement and deadline years get calendar-year drift.

Verdict distribution uses verified canonical records and discloses its own sample size. Timing drift has its own documented sample. Category tags do not multiply records. The unique forecast count stays unavailable until canonicalization resolves it. Collection counts include duplicates and draft labels. Family-weighted sensitivity analysis is not implemented; materially revised dated versions can each count, and this limitation is disclosed.

Updating the snapshot is a research action: review deadlines newly closed since the old snapshot and update relevant outcomes. Validation rejects due predictions still marked NOT_DUE or assessed before their deadline.

## Verification

```sh
npm run check
npm run build
npx playwright install chromium  # first use on a new machine
npm run test:browser
```

The browser suite starts the production preview on port 4100, exercises search/combined filters/sorting/pagination, exports all filtered rows, reloads stable URLs, checks clipboard sharing and analytics controls, runs axe accessibility checks on six routes, and captures desktop/mobile layouts. Screenshots and traces go to ignored `work/`.

Use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium npm run test:browser` to use an existing compatible Chromium installation. For a running development server, use `npm run dev`; the browser acceptance suite intentionally exercises the static production export.

## Implementation

Next.js App Router, TypeScript, Tailwind CSS, TanStack Table v8, Zod, Lucide, locally bundled Inter and Newsreader fonts. Small accessible linked bar charts use HTML/CSS rather than a heavy chart runtime. The decorative hero illustration is explicitly labeled as conceptual, not data.

Data and scoring are pure functions in `src/lib/`; page composition lives in `src/app/`; shared visual and interactive components live in `src/components/`. The canonical arrays are appropriate for hundreds or thousands of records. A future large corpus can move search to a prebuilt index without changing the underlying research model.

Design reference: [TechEngage’s scorecard](https://techengage.com/ray-kurzweil-predictions-scorecard-what-he-got-right-and-wrong/), used for presentation context only. Its aggregate percentages are not evidence for this dataset.
