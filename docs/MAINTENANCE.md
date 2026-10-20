# Returning to the project

This is an independent scorecard of Ray Kurzweil forecasts. The public reading experience starts with differences between fields, then lets readers inspect individual judgments without leaving the comparison. The sortable ledger is a secondary research view. Keep the interface calm and the prose concrete.

## Start here

1. Read the README and inspect `git status` before changing anything.
2. Run `npm ci` with Node 22+; Python 3 is also needed by the importer.
3. Run `npm run check`, then `npm run dev` for local editing.
4. For public-site packaging, use [STATIC_EXPORT.md](STATIC_EXPORT.md). Preparing an export, copying it to the host checkout, and publishing are separate operations.

No credentials, database or backend service are required. All fonts are local. `package-lock.json` is authoritative for dependency installation. Tests use an installed Chromium (`npx playwright install chromium` or `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`).

## What the numbers mean

The active release is v0.3 with a **2026-10-15** outcome cutoff. The 2026-10-18 citation supplement improves locators and adds corroborating sources; it does not change verdicts. The collection contains 84 curated forecast versions plus 88 original intake records retained as history.

Under the reference reading, 68 forecasts enter the mature cohort: 25 on time, 11 late, 16 partial and 16 missed. Fourteen are future targets and two are undated. Fully realized means on time plus late; partials earn no fractional credit. These are results for this selected collection, not Kurzweil's lifetime accuracy.

Strict, reference and broader interpretations can change criteria and eligibility. K036 is the reason the strict native cohort has 67 records while reference has 68. “Keep the same 67 predictions” compares the intersection of eligible records across all three readings. Do not silently change denominators or replace original deadlines with later forecast versions.

## Where to work

| Concern                                     | Entry point                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| Story, outcome summaries, examples          | `src/app/page.tsx`                                                        |
| Expandable field comparison                 | `src/components/category-explorer.tsx`                                    |
| Ledger and URL filters                      | `src/components/scorecard.tsx`                                            |
| Evidence drawer, focus and browser history  | `src/components/evidence-panel.tsx`                                       |
| Summary data projected into the drawer      | `src/lib/evidence-summary.ts`                                             |
| Static summary endpoint                     | `src/app/evidence/[id]/summary.json/route.ts`                             |
| Full records and historical assessments     | `src/app/predictions/[id]/page.tsx`                                       |
| Navigation and author CTAs                  | `src/components/navigation.tsx`, `src/app/layout.tsx`                     |
| Visual styles                               | `src/app/globals.css`                                                     |
| Eligibility and metrics                     | `src/lib/scoring.ts`                                                      |
| Record/source joins and coverage            | `src/lib/data.ts`                                                         |
| Evidence schemas and adaptation             | `src/lib/evidence-model.ts`, `src/lib/evidence.ts`                        |
| Import, integrity and release checks        | `scripts/import-data.ts`, `scripts/validate-data.ts`                      |
| Hosting location, public links and metadata | `config/public-site.json`, `src/lib/site-path.ts`, `src/lib/site-meta.ts` |

The filename table is a map, not a replacement for reading the relevant code. [DATA_MODEL.md](DATA_MODEL.md) describes the intake model; the evidence schema and [V03_INTEGRATION_REVIEW.md](V03_INTEGRATION_REVIEW.md) cover the later release.

The field and target-year charts share interpretation/cohort state through `src/components/story-comparison-context.tsx`. The time view in `src/components/target-year-chart.tsx` regroups the same eligible records via `targetYearResults` in `src/lib/publication.ts`. See [TIME_VIEW.md](TIME_VIEW.md) for the chart choice and why no drift regression or extrapolation is shown.

## Preserve the research trail

Original CSV/workbook inputs, supplied v0.2/v0.3 packages, and `data/releases/` are historical evidence. Never edit them to introduce a new judgment. Generated data under `data/generated/` and public download copies are outputs of the importer, not editing surfaces.

Add citation-only research as a new dated supplement following the existing validated schema. Record sources, locators, what the evidence supports, and check dates. For changed judgments or new predictions, introduce a versioned release, retain prior assessments, update the active-release importer deliberately, and add a dated changelog entry. The handoff in the supplied package is the research starting point.

All original IDs keep their routes. A reconciliation can describe a split, related version, uncertain attribution, or duplicate; it is not permission to redirect every old record. Exact dates, known-by dates and estimated eras remain distinct. The snapshot date is a research decision, never the build date.

## Interaction contracts

- Story dots, expanded rows, examples and ledger rows open evidence in place. Closing restores the initiating row, scroll and keyboard focus. Back closes; Forward reopens.
- `evidence=<ID>&evidenceReading=<mode>` identifies the open panel. The panel's interpretation is independent of the underlying `reading` filter.
- Stable record URLs remain useful for sharing, modified clicks, and the explicit “Full record & history” link. Summaries load on demand as static JSON; the original detail pages remain complete.
- Field rows group by judgment and sort by target year within each group. Every curated record appears once, with future and undated records outside scored totals.
- `/categories/` remains a compatibility redirect into the Story comparison, retaining interpretation/cohort choices.
- Native paths must use `sitePath` so the same features work at `/` locally and `/sites/kurzweil/` publicly.

## Checks and known limits

`npm run check` validates research integrity, TypeScript and unit tests. After changes to behavior, run `npm run build` and `npm run test:browser`. For hosting changes, build `export:site` and run `test:export`; `test:jekyll` adds isolated host-format validation when Jekyll is installed. Screenshots, fixtures and build products stay in ignored `work/` or `out/`.

Read [PUBLICATION_REVIEW.md](PUBLICATION_REVIEW.md) for the editorial position. The remaining work is research quality and coverage: independently collate original book passages, review ambiguous criteria, and build a bounded source population rather than adding only conspicuous hits or misses. Category samples are small and uneven. Do not turn the domain comparison into a claim about lifetime accuracy.

Useful history: `74f77b5` is the initial Phase 1 site; `6f1108a` is the pre-v0.3 checkpoint; `2ed668e` is the refined Story; `2d83eec` adds the evidence panel. Later work is recorded in [CHANGELOG.md](CHANGELOG.md). Build outputs can be regenerated from source. Publishing is tracked separately in the personal-site repository.
