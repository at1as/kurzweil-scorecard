# Publication pass — 2026-10-19

The original interface exposed the research workflow before explaining the result. This pass makes the reading order: finding, category comparison, concrete judgments, evidence. The public presentation and the research inventory remain one site; all original routes, data, releases and assessments are preserved.

## Editorial decision

The supported story is variation between fields within this collection. It is not “computers good, biology bad”: biology and medicine has 4/5 full realizations, networks 3/4, robotics and transport 1/5. Computing has 10/16 full realizations, only 5 on time. These counts are derived from the reference reading and include late outcomes. They do not establish general forecasting skill.

The homepage chart shows all 13 fields, sorted by sample size rather than success rate. Small, future-only and empty samples remain visible. Each field opens into a prediction table; records outside the comparison are labeled and do not add scored squares. The former category URL leads here, retaining interpretation and cohort choices. One square is one eligible forecast version; no partial points. Its symbol and accessible name identify its verdict without relying on color. A hover/focus preview shows the claim and deadline; Escape dismisses it. The expandable table makes the same claims accessible on touch screens. Alternative readings and the common-population comparison remain available.

The reference site was the public page in `what-if-i-joined`: explain what the reader is looking at, provide the useful comparison, then disclose the model. No private data was copied. MTS was treated as an editorial brief for legible, claim-led graphics; its current infographic posts were not retrievable in the web lookup, so this is not a visual reproduction of a specific MTS graphic.

## Changes

- Replaced the conceptual illustration, repeated collection metrics and stacked dashboards with a short introduction, one outcome summary and the category chart.
- Added three evidence-linked examples: wireless peripherals, supercomputing and household robots.
- Put bookkeeping, source confidence and extra comparison controls behind disclosures. The ledger opens with four columns and can restore its nine research columns.
- Rewrote methodology in plain language. Fixed the old claim that the default interpretation was strict; it is the stated reasonable reference reading. Fixed the partial definition to include progress after the original deadline.
- Restored the missing Late column in the detailed category outcome table.
- Kept every imported assessment and source artifact unchanged. No scores were changed to make the story work.

## Publication judgment

The interface is suitable for a public work-in-progress scorecard. A definitive verdict on Kurzweil's lifetime accuracy would still be premature. Before a stronger HN headline, independently review the records driving the domain comparison, check their original source wording, and broaden the uneven sample. The five medical records include different kinds of claims; “good at medicine” would overstate this evidence. Family weighting and different deadline distributions could also change the apparent contrast.

The most useful next research batch is a bounded source population, such as all 147 forecasts for 2009, reviewed consistently across fields. More selective additions could intensify selection bias. No new research or verdict changes were needed for this presentation pass.

## Verification

Chart counts and IDs reconcile to the existing scoring logic in every reading, including the common-population option. Unit tests protect the stated contrasts and empty-category behavior. Browser coverage checks drill-down, URL persistence, disclosure controls, the four/nine-column table, legacy routes, CSV export, mobile layout and automated accessibility.

First-pass checks: production export built all 180 routes; 67 unit tests and 12 browser tests passed, including automated accessibility checks on all primary pages and representative records. `git diff --check` passed. No files under data, public/data or the imported evidence packages changed.

Homepage consolidation checks: 67 unit tests and 14 browser tests passed; production export still builds all 180 routes. Added coverage for expandable rows, future records outside the score, hover/focus previews, Escape dismissal, mobile subrows and category URL compatibility. All 84 curated records appear exactly once across scored and unscored subrows in each interpretation and cohort. Evidence files and scoring rules are unchanged.

## Copy and layout refinement

Removed vague phrasing such as “plenty of hits,” “worth examining” and “reproducible by design.” Replaced the wireless example’s charging-cable argument with the narrower claim that practical wireless keyboards and mice can fulfill the forecast even when buyers choose wired models. The homepage and methodology now address preference, cost and regulation as factors to weigh case by case, preserving the difference between capability and adoption claims. No imported assessment or historical rationale was rewritten.

Field counts now include percentages to one decimal place, with the same assessed denominator for full realization and on-time outcomes. Fields without assessed records have no percentage. Closed field chevrons point right and expanded ones point down. Both row states have the same right inset, and headings can use their containing page width while paragraph line lengths remain limited.

### Evidence popup assessment

Recommend a side panel for quick evidence review from the comparison and example cards. It should contain the claim, selected interpretation, criterion, deadline, outcome, explanation and named source links. Preserve the current field expansion, reading and scroll position when it closes. On small screens it can fill the viewport. Keep the existing record URL as a link for sharing, opening a new tab, complete source notes and assessment history. Opening the panel should add a history entry so Back closes it; Escape and a visible close control should restore focus to the initiating link. The existing detail page is too long to place wholesale inside a popup. This pass evaluates that interaction; navigation is unchanged.

## Reading order and explanations

Within each field, scored predictions now sort by judgment and then target year, with record ID breaking ties. A regression check covers all three interpretations. Section headings omit sentence punctuation. A shaded “Judgments & sources” area separates the explanation and provenance from the comparison; the numbered section labels are removed.

The population setting now says “Keep the same 67 predictions,” with separate On and Off explanations. The specific brain-modeling forecast is linked below as the reason the counts can differ. The wireless example distinguishes the technology from consumer preference on both the homepage and methodology page. The existing default and stricter assessments remain unchanged.

Checks: 68 unit tests and 14 browser tests passed; the production export builds all 180 routes. Browser coverage verifies both states of the comparison setting. Desktop and mobile screenshots were reviewed. Raw data, imported packages, verdicts and record history are unchanged.

## Evidence panel implementation

The recommended side panel is now the default detail interaction from the Story and ledger. It presents the selected assessment, criterion, target, deadline/review outcomes and named outcome sources. Source notes and original wording/attribution expand inside the panel. Full research history stays available through an explicit full-record link. Normal modified clicks still follow the stable record URL.

The underlying page remains mounted. Close, Escape, backdrop click and browser Back restore the originating row, keyboard focus and scroll position, including URLs with a section anchor. Forward reopens the panel. Reading changes inside it do not change the underlying comparison. A native modal dialog makes background content inert; an explicit Tab loop keeps keyboard focus inside. On mobile it fills the viewport. Failed loads offer retry and a full-record fallback.

Each record summary is generated during static export and fetched only when needed. No application server or new dependency is introduced. The 172 existing record pages and all original data remain intact. Tests cover summary fidelity across all readings, deadline exclusions, Story/ledger return behavior, browser history, focus containment, clipboard links, mobile accessibility and loading failures.
