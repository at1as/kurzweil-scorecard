> **Historical build brief.** This is the original project request. The current interface and research state are documented in [README.md](README.md) and [docs/MAINTENANCE.md](docs/MAINTENANCE.md); some requirements below have since changed.

# Build an Interactive Ray Kurzweil Predictions Scorecard

## Objective

Build a polished, interactive, publicly accessible website evaluating Ray Kurzweil's historical and future predictions.

The design reference is [TechEngage's Kurzweil scorecard](https://techengage.com/ray-kurzweil-predictions-scorecard-what-he-got-right-and-wrong/), especially "The Scorecard as of 2026."

However, our website should be considerably more detailed, searchable, transparent, and analytically useful. It should ultimately accommodate hundreds of independently assessed predictions, with verifiable original sources and historical outcomes.

The central questions are:

1. How accurate has Kurzweil been overall?
2. How accurate has he been within each category (AI, computing, biology, longevity, etc.)?
3. How often was his prediction directionally correct but early or late?
4. Does his accuracy change based on the decade, forecast horizon, or type of prediction?
5. Which predictions remain pending, and which have demonstrably failed?

Build a real, deployable website, not a static mockup.

## Input files

I have attached:

- `kurzweil_prediction_intake_v0_1.csv` — the structured prediction intake dataset.
- `kurzweil_scorecard_v0_1.xlsx` — the workbook containing the ledger, scorecard, rubric, category taxonomy, data dictionary, legacy research, and source coverage.

**Important:** These are working research materials, not an independently verified final audit.

The CSV contains 88 candidate records, including possible duplicates. None has completed the new verification process. The workbook's "Legacy import" contains preliminary historical assessments that must not be presented as established facts or silently converted into official ratings.

Use the CSV as the initial machine-readable input and the workbook as the specification for fields, scoring methodology, and categories.

Retain all imported data and its provenance. Do not invent source URLs, verified outcomes, or scoring statistics.

## Website structure

### 1. Overview / Dashboard

Create a compelling landing page titled **Ray Kurzweil Prediction Scorecard**, with the subtitle **An evidence-based audit of technological forecasting**.

Include an as-of date, a short description, and clear separation between collected predictions and independently scored predictions.

Provide summary metrics for:

- Unique predictions collected
- Predictions verified and scored
- Correct on-time predictions
- Predictions eventually realized but late
- Partial predictions
- Wrong or missed predictions
- Future/pending predictions

Show these metrics only for the appropriate verified populations.

Create interactive visualizations including a verdict breakdown, accuracy by category, accuracy by target decade, and timing drift for predictions eventually realized.

Charts should reveal underlying sample sizes and allow users to navigate to the relevant predictions.

Do not show a misleading zero-percent accuracy rate simply because no predictions have yet been reviewed.

### 2. Interactive Prediction Scorecard

This is the central feature of the website.

Implement a dense but readable interactive table with columns:

**Prediction | Category | Prediction made | Target year | Verdict | Actual year | Timing drift**

Support full-text search, sorting, pagination, and combined filters for verdict, category, subcategory, source, publication decade, target decade, and verification status.

Make the filter state shareable through URL parameters.

Support multiple views: all candidates, verified predictions, fulfilled predictions, misses, and future predictions.

Use restrained, distinguishable status indicators:

**CORRECT, LATE, PARTIAL, WRONG / MISSED, PENDING, UNSCORABLE, UNREVIEWED.**

Clicking any prediction should open a detail page or expanded view.

Add a CSV export for the filtered selection.

### 3. Detailed Prediction Pages

Each prediction should have a stable, shareable URL.

Display the following information where available:

**Original prediction:** Faithful quotation or paraphrase, with the original source, publication year, page number, and link.

**Normalized claim:** A concise, testable description of exactly what was predicted.

**Success criteria:** What would have to happen for this prediction to count as fulfilled? Preserve quantitative thresholds, adoption requirements, price/performance constraints, and any specifically required technology.

**Timeline:** When Kurzweil made the prediction, its original deadline, the year of actual fulfillment (if achieved), and its assessment as of the review date.

**Verdict:** A prominent status with a short explanation.

**Evidence:** Source links supporting or challenging fulfillment, with dates.

**Nuance:** Explain any distinction between predicting a technological capability, predicting its widespread adoption, and correctly predicting its date.

**Related predictions:** Link repetitions, revised deadlines, and other statements belonging to the same forecast family.

**Research metadata:** Verification state, confidence, last reviewed date, and unresolved questions.

Do not treat a related technological development as full realization if it doesn't meet the original claim.

### 4. Category Comparison

Build a dedicated analytics page for comparing categories.

Start with the taxonomy in the workbook, including computing hardware, networks, AI/software, interfaces and VR/AR, medicine, longevity, neuroscience, robotics, manufacturing, energy, economy/society, media/education, and security/warfare.

Show counts and verdict distributions by category, strict on-time accuracy, eventual realization rate, and timing drift where supported.

Allow drilling down into individual predictions. Preserve one primary category per prediction, while supporting multiple subcategory tags without double-counting records.

Also support grouping by prediction type: capability, adoption, performance/cost, and social or institutional outcome.

### 5. Methodology and Source Coverage

Provide a readable methodology page covering the status definitions, date interpretation, strict-versus-generous interpretations, how duplicates are treated, and how category statistics are calculated.

Define:

**CORRECT:** The full original prediction was realized by its original deadline. Early realization can be indicated separately.

**LATE:** The full prediction was realized, but after its original deadline. Show the delay in years.

**PARTIAL:** Meaningful elements were realized, but the original claim has not been fully fulfilled.

**WRONG / MISSED:** The original deadline has passed and the claim was not fulfilled.

**PENDING:** The original deadline is still in the future and the prediction has not yet been fulfilled.

**UNSCORABLE:** The prediction cannot be assessed reliably using an identifiable success criterion or deadline.

**UNREVIEWED:** The imported statement has not yet undergone source and outcome verification.

Allow a DISPUTED flag in addition to the verdict.

Crucially, distinguish **the outcome at the original deadline** from **the outcome as of the current review date**.

A prediction that failed in 2009 but was realized in 2015 should be labeled LATE, with +6 years of drift. A prediction that failed in 2009 and is still unfulfilled should remain MISSED—not LATE.

Future predictions must be excluded from the denominator for deadline-based accuracy.

Include a source-coverage view showing which books, chapters, interviews, and reports have been examined, partially extracted, or remain to be processed. Do not imply the dataset is exhaustive.

## Data architecture

Treat this as a growing research dataset.

Create a documented, strongly typed canonical prediction model covering identity, forecast family, primary category, tags, source attribution, original wording, normalized claim, deadlines, outcomes, evidence links, assessment, confidence, and research status.

Preserve source text separately from editorial interpretation.

Preserve original deadlines when Kurzweil repeats or revises a forecast. Do not silently overwrite the older prediction.

Support multiple source references and multiple outcome-evidence references per prediction.

Build a reproducible import process from CSV to normalized JSON or TypeScript data. Keep the original files unchanged.

Do not make the website depend on Excel formulas at runtime.

Make it straightforward to add, correct, or remove predictions from a curated data file and rebuild the site. A database or admin system is not required for the initial version.

The data model should be ready for hundreds or thousands of entries.

## Statistical integrity

For each prediction, store the original deadline, verification state, fulfillment-at-deadline, fulfillment-at-review, and first full-achievement year when known.

Compute strict on-time accuracy only from verified, due, scorable, deduplicated forecasts.

Compute eventual realization separately, using the same eligible population.

Show partial results as their own category. Do not award them an arbitrary fraction of a point in the primary score.

Calculate timing drift only where the prediction has fully occurred and both relevant dates are established.

Never allow duplicate predictions or statements with multiple tags to inflate overall statistics.

Always disclose denominators, sample sizes, date cutoffs, and any unresolved uncertainty.

## Design direction

Aim for a thoughtful editorial and data-journalism aesthetic rather than a generic SaaS dashboard.

Use generous whitespace, excellent typography, restrained colors, readable charts, and compact data tables. The site should feel like a serious research project, but still be engaging for casual readers.

The landing page should immediately communicate the purpose, with a clear path to exploring the predictions.

Use color to support verdict recognition without relying on color alone. Ensure mobile responsiveness, accessibility, keyboard navigation, and readable chart labels.

Take inspiration from the simplicity of the TechEngage scorecard, but make our information design significantly better.

## Implementation

Use **Next.js, TypeScript, Tailwind CSS**, and suitable table/chart libraries unless the existing repository has a different established stack.

Prefer a static or statically generated architecture deployable to Vercel or another standard hosting platform. Avoid requiring a paid backend or authentication.

Include a clean component architecture, import/validation scripts, and tests for the scoring rules, deduplication, denominators, filtering, and date-drift calculations.

Provide a README explaining local development, deployment, data updates, and the distinction between provisional and verified records.

## Initial data behavior

Import all 88 candidate records from the supplied CSV.

Since their statuses are UNREVIEWED, show them in a clearly labeled research-intake view. They should be searchable and browsable, but not counted as scored successes or failures.

The dashboard can initially display collection and verification progress, category coverage, and target-date distributions. Accuracy metrics should say "Not yet available" until a verified sample exists.

Do not generate fictional records or statistics merely to populate visualizations.

If verified predictions are subsequently added, the same interface should automatically enable the corresponding accuracy summaries.

## Deliverables and acceptance criteria

Deliver a complete working website with the overview dashboard, searchable predictions table, detail pages, category comparisons, methodology, and source coverage.

The site should compile, pass type checks and tests, and be ready to deploy.

A new verified prediction must be addable through a documented data file without changing UI code. All relevant charts and statistics must update automatically.

Every displayed statistic should be traceable back to eligible underlying records.

Make practical engineering decisions without unnecessary clarification. Prioritize a finished, visually polished, maintainable site with correct data handling over speculative features.

Focus this initial implementation on the **website and data infrastructure**. Do not represent the historical research as completed. Extensive new source research and fact-checking will be a separate phase.
