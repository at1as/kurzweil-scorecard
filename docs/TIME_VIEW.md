# Target-year comparison

The Story now compares the same scored population by target year as well as by field. The default release has six due target years. Two dominate: 2009 contains 38 forecasts, and 2019 contains 23—61 of the 68 due forecasts.

| Target year | Predictions | On time | Late | Partial | Missed |
| ----------- | ----------: | ------: | ---: | ------: | -----: |
| 1998        |           1 |       1 |    0 |       0 |      0 |
| 2009        |          38 |      16 |    9 |       8 |      5 |
| 2010        |           4 |       1 |    2 |       1 |      0 |
| 2019        |          23 |       7 |    0 |       6 |     10 |
| 2020        |           1 |       0 |    0 |       0 |      1 |
| 2025        |           1 |       0 |    0 |       1 |      0 |

These are reference-reading counts at the 2026-10-15 cutoff. This table is an explanation of the current release; the interface derives its values from records.

## Chart choice

Stacked columns show composition and sample size together. Counts are the default so a single prediction does not look equivalent to a group of 38. The percentage view makes composition easier to compare; every column retains its sample size. The x-axis contains target-year groups with equal spacing, explicitly labeled as such. It is not a continuous time series and has no interpolating line.

Selecting a column opens that year's records below the chart, grouped by judgment. Their links use the evidence panel, keeping the chart and selected year in place. A close control restores focus to the year button. The count/percentage choice and selected year are local presentation state; the reading persists in the existing URL parameter. Each reading uses its eligible forecasts; the former common-cohort toggle was removed because it only excluded K036.

Field and year comparisons share `StoryComparisonProvider`. `targetYearResults` regroups the field chart's exact eligible records, so the chart cannot quietly introduce a second denominator. Future and undated forecasts remain outside it. K036's 2025 column disappears in the strict reading, where its deadline is 2026 and has not passed at the research cutoff. Both interpretation controls update the same state.

## Why there is no drift regression or extrapolation

The supplied timing inventory has two `EXACT_EVENT` records, 33 `DOCUMENTED_BY` records, two `EDITORIAL_ERA_BOUND` records and 47 `UNESTABLISHED` records. One of the dated events (chess) retains a −3 to −1 year range because the source deadlines differ. The other (K033) has the measured +4-year delay. One documented-by record is undated and earns no deadline credit.

A documented-by year is an upper bound on arrival, not its first occurrence. Plotting all such years as exact drift would invent precision. A still-unfulfilled forecast has no completed delay; its overdue duration cannot be averaged with observed completion times as though it had arrived.

The older groups have had more time to realize their forecasts, and the groups cover different topics and criteria. This selected collection is not a representative sequence of comparable experiments. A line fitted through the target-year results would therefore give a misleading impression of a forecast about future accuracy.

A later timing view could display explicit event dates, completion intervals and still-open observations separately. That would first need more supported first-achievement dates or bounded intervals and a defined source population. The current chart makes no extrapolation and changes no imported assessment.

## Validation

Unit checks compare every plotted ID against the eligible population in all three readings (and the retained research helper's common cohort), protect the 2009/2019 counts, and verify deadline-boundary exclusions. Browser checks cover both axes, shared controls, URL reloads, evidence focus restoration, expanded records, mobile layout and automated accessibility.
