import { geocode } from "@/lib/geocode";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim();
  const country = params.get("country")?.trim() || undefined;
  if (!q || q.length > 200) return Response.json({ error: "bad query" }, { status: 400 });
  const point = await geocode(q, country);
  if (!point) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(point);
}
