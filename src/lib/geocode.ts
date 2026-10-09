export type GeoPoint = { lat: number; lng: number; label: string };

/** Geocodes free text via Nominatim (server-side only, identifies the app per usage policy). */
export async function geocode(query: string, countryCode?: string): Promise<GeoPoint | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("accept-language", "ru");
  if (countryCode) url.searchParams.set("countrycodes", countryCode.toLowerCase());

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "shawarma-preorder/0.1 (MVP)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const [hit] = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name } : null;
  } catch {
    return null;
  }
}
