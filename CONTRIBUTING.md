# Contributing

The most useful contributions improve a forecast's evidence or make the comparison easier to understand. For setup and checks, start with the [README](README.md).

## Question a judgment or add evidence

Include:

1. The prediction ID, such as `K009`, and the interpretation being discussed.
2. The source passage, publication date, page or section, and a link where possible. Distinguish a quotation from a paraphrase.
3. Evidence of what happened, when it happened, and which criterion it supports or contradicts.
4. The proposed correction and why it follows from that evidence.

A working technology and widespread adoption are different claims. Preserve the original deadline, population, scale and mechanism. If the source is ambiguous, explain the competing readings instead of discarding one silently.

New research should improve source coverage, not only add striking successes or failures. The [integration review](docs/V03_INTEGRATION_REVIEW.md) lists remaining gaps.

## Change the data

Do not edit original intake files, supplied evidence packages or previous releases. Do not edit generated JSON directly.

Citation-only additions go in dated supplements. New records or changed judgments require a versioned release that retains the previous assessment, sources and stable IDs. Follow the [maintenance guide](docs/MAINTENANCE.md) and add a [changelog](docs/CHANGELOG.md) entry describing affected IDs and the reason for the change.

## Change the interface

Keep detailed evidence accessible from the Story without losing the reader's place. Preserve keyboard focus, browser history, shareable URLs and the original research routes. Do not change scores to make the presentation cleaner.

Run `npm run check`. For behavior changes, build and run `npm run test:browser`. Changes to URLs or static hosting also need `npm run export:site` and `npm run test:export`. Include before/after screenshots when they help explain a visual change. Keep temporary outputs in `work/`.

The project uses the [MIT License](LICENSE). Preserve source attribution; this license does not relicense third-party quotations or original source works.
