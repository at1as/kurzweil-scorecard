# Dataset and site history

## Citation supplement and interface fixes — 2026-10-18

Fixed the missing space below the prediction-ledger notice and inset native dropdown chevrons consistently. Added a versioned citation supplement resolving all 15 previously blank outcome-reference locators, checking one additional Pew section, and adding five primary sources/eight corroborating evidence links. Source-specific findings explain what each citation does and does not support. Source catalogue now contains 103 entries.

Original v0.3 files and every earlier release remain unchanged. The complete imported release object remains available under each record's `release` field. New primary references and check history are appended to the site's evidence projection. Outcome cutoff remains 2026-10-15; citation checks are dated 2026-10-18. Scoring is unchanged.

## Evidence v0.3 — snapshot 2026-10-15

Replaced K001–K050 by stable ID and added K051–K084. Preserved all v0.2 previous assessments exactly, the original 88-row intake, prior reconciliation notes, and downloadable v0.1/v0.2 releases. The pre-integration checkpoint is `6f1108a`.

The active reference cohort has 68 mature forecasts: 25 on-time and 36 fully realized by review. All due outcomes are assessed. Added reference, strict/alternative and broader reading controls, separate deadline/review columns, confidence metadata, conditional legacy/component outcomes, common-cohort comparisons, and timing series with exact/known-by/editorial distinctions. Source catalogue grows to 98 used references. Raw supplied files are unchanged.

K036's alternative deadline makes the native strict cohort 67; mode comparisons use the equal 67-record intersection. K001 now has a correct outcome and bounded early timing. K033 now uses the supplied measured 2013 milestone. These update live judgments while retaining prior decisions in history. See `V03_INTEGRATION_REVIEW.md` for remaining research gaps.

## Evidence v0.2 — snapshot 2026-10-14

Integrated the supplied immutable `2026-10-14-evidence-v0.2` release. No editorial judgments or source dates were changed during integration. All 50 authoritative records and 88 reconciliation decisions are retained. Sources are joined by ID, and original routes stay available without redirects.

The default cohort is the supplied 13 eligible due assessments: 2 correct, 6 partial, 5 wrong/missed. Nine review outcomes remain unknown; full-realization rate is withheld. K033 retains its excluded, interpretation-dependent 3–4-year hardware-proxy assessment. Original v0.1 data and the full v0.2 package remain downloadable.

## Phase 1 / v0.1 — snapshot 2026-10-13

Restore point: Git commit `74f77b5` (`Build initial Kurzweil prediction scorecard`). The site contained 88 unreviewed imported leads, original provenance, and scoring infrastructure. Original downloadable data and configuration are retained in `data/releases/v0.1/`.

## Future corrections

Add a dated release entry and retain previous files. Record affected IDs, the previous and replacement judgments, new evidence, and the reason for correction. Do not rewrite historical source dates or change an immutable release in place. Related deadline versions remain separate records and keep their original routes.
