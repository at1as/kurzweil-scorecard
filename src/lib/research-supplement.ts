import { z } from "zod";
import { sourceSchema } from "./evidence-model";
import type { Prediction } from "./model";
const text = z.string().min(1);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const citationSupplementSchema = z
  .object({
    id: text,
    version: text,
    base_release: z.literal("0.3"),
    checked_at: date,
    outcome_cutoff: date,
    scope: text,
    sources: z.array(sourceSchema),
    citations: z.array(
      z
        .object({
          record_id: z.string().regex(/^K\d{3}$/),
          source_id: text,
          locator: text,
          finding: text,
          limitations: text,
          stance: z.enum(["SUPPORTS", "CHALLENGES", "CONTEXT"]),
        })
        .strict(),
    ),
  })
  .strict();
export type CitationSupplement = z.infer<typeof citationSupplementSchema>;
export function applyCitationSupplement(
  p: Prediction,
  s: CitationSupplement,
): Prediction {
  const citations = s.citations.filter((c) => c.record_id === p.id);
  if (!citations.length) return p;
  const evidence = [...p.evidence];
  for (const c of citations) {
    const index =
      p.release?.evidence.findIndex((ref) => ref.source_id === c.source_id) ??
      -1;
    if (index >= 0)
      evidence[index] = {
        ...evidence[index],
        accessedAt: s.checked_at,
        stance: c.stance,
        note: `${c.locator} ${c.finding} Evidence limits: ${c.limitations}`,
      };
    else {
      const source = s.sources.find((source) => source.id === c.source_id);
      if (!source)
        throw new Error(`${p.id}: unknown added source ${c.source_id}`);
      evidence.push({
        sourceId: source.id,
        id: `${s.id}-${c.source_id}`,
        title: source.title,
        url: source.url,
        publishedAt: source.publication_date,
        accessedAt: s.checked_at,
        stance: c.stance,
        note: `${c.locator} ${c.finding} Evidence limits: ${c.limitations}`,
      });
    }
  }
  return {
    ...p,
    evidence,
    research: {
      ...p.research,
      history: [
        ...p.research.history,
        {
          date: s.checked_at,
          note: `${s.id}: ${citations.length} primary citation checks/additions. ${s.scope}`,
        },
      ],
    },
  };
}
