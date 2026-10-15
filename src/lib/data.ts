import raw from "../../data/generated/predictions.json";
import spec from "../../data/generated/specification.json";
import config from "../../data/config.json";
import type { Prediction } from "./model";
export const predictions = raw as Prediction[];
export const categories = spec.categories;
export const coverage = spec.coverage;
export const AS_OF = config.asOf;
export const AS_OF_LABEL = new Date(`${AS_OF}T12:00:00Z`).toLocaleDateString(
  "en-US",
  { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" },
);
export const datasetVersion = config.version;
