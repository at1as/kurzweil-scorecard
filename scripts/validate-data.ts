import records from "../data/generated/predictions.json";
import spec from "../data/generated/specification.json";
import config from "../data/config.json";
import { validateDataset } from "../src/lib/validation";
import { summarize } from "../src/lib/scoring";
const rows = validateDataset(
  records,
  spec.categories.map((c) => c.name),
  config.asOf,
);
console.log("Dataset validated:", summarize(rows, config.asOf));
