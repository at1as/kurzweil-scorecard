import type { Reading } from "./evidence-model";
import { sitePath } from "./site-path";
export type Selection = { id: string; reading: Reading };
export function isLegacyId(id: string) {
  return /^(?:AUD|DEC|EXE)-/.test(id);
}
export function recordUrl({ id, reading }: Selection) {
  if (isLegacyId(id)) {
    return sitePath(
      `/predictions/?view=intake&evidence=${encodeURIComponent(id)}`,
    );
  }
  return sitePath(
    `/predictions/${id}/${reading === "reference" ? "" : `?reading=${reading}`}`,
  );
}
