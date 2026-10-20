import { allRecords, AS_OF } from "@/lib/data";
import { evidenceSummary } from "@/lib/evidence-summary";

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return allRecords.map((p) => ({ id: p.id }));
}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = allRecords.find((p) => p.id === id);
  if (!record) return new Response("Not found", { status: 404 });
  return Response.json(evidenceSummary(record, AS_OF));
}
