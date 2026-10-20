# Kurzweil Scorecard

Work in this saved repository under `~/Repos`. Start with README.md; `docs/MAINTENANCE.md` maps the current architecture and decisions. For packaging, read `docs/STATIC_EXPORT.md`.

- Keep the Story concise and field comparisons prominent. Detailed evidence opens in place; retain full record URLs, focus restoration and browser history behavior.
- Preserve all original intake files, supplied evidence packages, previous assessments and stable record IDs. Do not edit generated data. Use dated supplements for citation additions and new versioned releases for changed judgments.
- The active outcome snapshot is 2026-10-15. Build time does not advance it. Report selected-subset metrics with the actual eligibility denominator, never lifetime accuracy.
- Run `npm run check` for data/code changes. Build before browser tests. Use `npm run export:site` and `npm run test:export` when changing public paths or export behavior.
- Next links handle the configured base path automatically. Use `sitePath` for native anchors, fetches and History API calls.
- `export:site` writes only ignored local build output. `export:copy` is a dry run unless `--write` is supplied. Copying to the personal-site checkout and publishing are distinct actions; follow the user's current scope and leave unrelated host work alone.
- Do not commit `work/`, `out/`, `.next/`, dependencies, credentials or local runtime paths. No new dependency or network service is needed for ordinary content/layout changes.
