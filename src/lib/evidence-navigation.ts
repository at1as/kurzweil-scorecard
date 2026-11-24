import type { Reading } from "./evidence-model";
import { sitePath } from "./site-path";
export type Selection = { id: string; reading: Reading };
export const PUBLIC_EXPORT = process.env.NEXT_PUBLIC_SITE_EXPORT === "1";
export function isLegacyId(id: string) {
  return /^(?:AUD|DEC|EXE)-/.test(id);
}
export function recordUrl({ id, reading }: Selection) {
  if (isLegacyId(id)) {
    return sitePath(
      `/predictions/?view=intake&evidence=${encodeURIComponent(id)}`,
    );
  }
  if (PUBLIC_EXPORT) {
    const query =
      reading === "reference"
        ? `evidence=${encodeURIComponent(id)}`
        : `evidence=${encodeURIComponent(id)}&evidenceReading=${reading}`;
    return sitePath(`/predictions/?${query}`);
  }
  return sitePath(
    `/predictions/${id}/${reading === "reference" ? "" : `?reading=${reading}`}`,
  );
}
