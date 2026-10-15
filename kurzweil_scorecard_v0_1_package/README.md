# Kurzweil prediction scorecard — working structure v0.1
Snapshot: 2026-10-13

## What this package is
An audit-ready workbook plus recovered earlier research. It is NOT an exhaustive list of Kurzweil's predictions and NOT an independently validated accuracy study.

Recovered table rows: 93, consisting of 88 candidate rows (duplicates included) and 5 aggregate rows. The three earlier reports are preserved without textual edits. Original status labels are retained in Legacy import, not accepted into the new scoring fields. The new ledger has zero verified canonical predictions at release.

## Files
- kurzweil_scorecard_v0_1.xlsx: compact Scorecard, editable Ledger, Legacy import, By category, Rubric, Categories, Coverage, Data dictionary and Start.
- kurzweil_prediction_intake_v0_1.csv: 88 candidate rows with new review state UNREVIEWED.
- legacy/: three original extracted reports, unchanged.
- legacy_import.json: parsed archived rows, including original text and parsing notes.

## Evaluation design
Store outcome at the original deadline and outcome at the current review separately. Use CORRECT, LATE, PARTIAL, WRONG / MISSED, PENDING, UNSCORABLE, UNREVIEWED and EXCLUDED as compact labels. EARLY, OVERDUE and DISPUTED are qualifiers.
A passed deadline is a failed dated forecast, not proof that the outcome will never occur. A future unfulfilled forecast is pending, even when progress is disappointing.
Partial means material fulfillment of the actual claim, not the existence of related research.
Record original wording, source date, target interval, source locator, success criteria, geography/population, deployment stage, conditionality, outcome evidence and confidence.
Do not invent precise years for vague date ranges or actual-achievement dates for unmet claims.

## Counting
Use one primary domain per canonical claim and secondary tags for cross-cutting mechanisms. Link atomic subclaims to parent statements and repeated/revised versions to forecast families.
A changed deadline must not erase the original prediction. Repeated statements must not multiply success votes.
The initial By category sheet is a formula-based unweighted view of verified canonical rows only. Family-level and parent-weighted sensitivity analyses are not yet implemented.
Strict on-time rate = full at original deadline / due, verified, canonical, scorable claims.
Full realization by review = full at deadline or by review / the same mature cohort.
Pending claims, including early successes with future deadlines, are excluded from this mature-cohort comparison. Partial and excluded counts should remain visible. Do not use a 0.5 partial weight as the default result.

## Date and capacity limitations
The workbook initially uses confirmed year endpoints. At the October 2026 snapshot, whole-year 2026 deadlines remain open; mature-cohort formulas therefore include deadlines through 2025.
Exact-date forecasts and interval sensitivity require additional date handling before publication.
Formula-ready capacity: 500 Ledger rows (6–505). Only 88 are populated. Extra blank rows are capacity, not predictions.
The current compact Scorecard is linked to the 88 imported rows. Extend its formulas/table when adding rows; extend all capacity ranges beyond 500 as needed.

## Corpus expansion
The author's official retrospective identifies 147 predictions for 2009 in The Age of Spiritual Machines. That number is not a lifetime total. The primary retrospective has been located and sampled, not newly extracted in full in this package. Later target sections, other books, interviews and revised forecasts remain to be collected systematically. Record extraction coverage by source so that an incomplete corpus cannot be mistaken for an exhaustive one.

## Source references
Format reference: https://techengage.com/ray-kurzweil-predictions-scorecard-what-he-got-right-and-wrong/
Primary retrospective locator: https://www.thekurzweillibrary.com/how-my-predictions-are-faring-an-update-by-ray-kurzweil
Primary retrospective PDF: https://www.thekurzweillibrary.com/images/How-My-Predictions-Are-Faring.pdf
Dated Turing-test wager and criteria: https://longbets.org/1/
Book locator: https://www.booksbyraykurzweil.com/

Earlier report citation tokens are archived verbatim but are NOT considered reverified, working evidence links.
