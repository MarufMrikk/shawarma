import { geocode } from "@/lib/geocode";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q || q.length > 200) return Response.json({ error: "bad query" }, { status: 400 });
  const point = await geocode(q);
  if (!point) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(point);
}
