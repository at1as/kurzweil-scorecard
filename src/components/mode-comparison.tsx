import Link from "next/link";
import type { Prediction } from "@/lib/model";
import { READINGS, READING_LABELS } from "@/lib/evidence-model";
import { commonCohort, selectReading } from "@/lib/interpretations";
import { summarize } from "@/lib/scoring";
import { scorecardUrl } from "@/lib/filters";
const pct = (v: number | null) =>
  v === null ? "—" : `${(v * 100).toFixed(1)}%`;
export function ModeComparison({
  records,
  asOf,
}: {
  records: Prediction[];
  asOf: string;
}) {
  const common = commonCohort(records);
  const due = summarize(records, asOf).eligible;
  return (
    <div className="panel mode-comparison">
      <h3>How the reading changes the result</h3>
      <p>
        Same {common.length} predictions in every reading. One brain-modeling
        forecast is left out because its alternative deadline has not passed.
      </p>
      <div className="table-scroll">
        <table className="analysis-table">
          <caption className="sr-only">
            Reading comparison on the same eligible forecast versions; selected
            subset only.
          </caption>
          <thead>
            <tr>
              <th scope="col">Reading</th>
              <th scope="col">Predictions</th>
              <th scope="col">On time</th>
              <th scope="col">Fully realized</th>
            </tr>
          </thead>
          <tbody>
            {READINGS.map((mode) => {
              const stats = summarize(
                common.map((p) => selectReading(p, mode)),
                asOf,
              );
              return (
                <tr key={mode}>
                  <th scope="row">{READING_LABELS[mode]}</th>
                  <td>
                    <Link
                      href={scorecardUrl({ reading: mode, cohort: "common" })}
                    >
                      {stats.eligible}
                    </Link>
                  </td>
                  <td>
                    <Link
                      href={scorecardUrl({
                        reading: mode,
                        cohort: "common",
                        verdict: "CORRECT",
                      })}
                    >
                      {pct(stats.onTimeRate)}
                      <small>
                        {stats.onTime} / {stats.eligible}
                      </small>
                    </Link>
                  </td>
                  <td>
                    <Link
                      href={scorecardUrl({
                        reading: mode,
                        cohort: "common",
                        view: "fulfilled",
                      })}
                    >
                      {pct(stats.realizationRate)}
                      <small>
                        {stats.realized} / {stats.eligible}
                      </small>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="footnote">
        The main comparison has {due} due predictions. This comparison uses the{" "}
        {common.length} eligible in all three readings. Broader success may mean
        meeting different conditions; open a record to see what changed.
      </p>
    </div>
  );
}
