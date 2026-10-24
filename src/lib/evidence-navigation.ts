import type { Reading } from "./evidence-model";
import { sitePath } from "./site-path";
export type Selection = { id: string; reading: Reading };
export function recordUrl({ id, reading }: Selection) {
  return sitePath(
    `/predictions/${id}/${reading === "reference" ? "" : `?reading=${reading}`}`,
  );
}
