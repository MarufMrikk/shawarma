import type { OrderStatus } from "@/generated/prisma/enums";
import type { ModifierSnapshot } from "@/lib/pricing";

/**
 * Static demo build for GitHub Pages (NEXT_PUBLIC_DEMO=1): no server, so orders are kept in
 * the browser and their status is simulated. The real app never takes these branches.
 */
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO === "1";

export type DemoOrder = {
  id: string;
  venueName: string;
  venueSlug: string;
  venueAddress: string;
  customerName: string;
  pickupCode: string;
  currency: string;
  createdAt: number;
  pickupAt: number;
  items: { name: string; quantity: number; lineTotal: number; modifiers: ModifierSnapshot[] }[];
  totalAmount: number;
};

const key = (id: string) => `demo-order:${id}`;

export function saveDemoOrder(order: DemoOrder) {
  try {
    localStorage.setItem(key(order.id), JSON.stringify(order));
  } catch {}
}

export function loadDemoOrder(id: string): DemoOrder | null {
  try {
    const raw = localStorage.getItem(key(id));
    return raw ? (JSON.parse(raw) as DemoOrder) : null;
  } catch {
    return null;
  }
}

/** Simulated kitchen: accepted after 15 s, cooking after 45 s, ready 2 min before pickup time. */
export function demoStatus(order: DemoOrder, now: number = Date.now()): OrderStatus {
  const age = now - order.createdAt;
  if (now >= order.pickupAt - 2 * 60_000 && age > 60_000) return "ready";
  if (age > 45_000) return "cooking";
  if (age > 15_000) return "accepted";
  return "new";
}

/** Browser-side geocoding (the demo has no /api/geocode). */
export async function demoGeocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "ru");
  const res = await fetch(url);
  if (!res.ok) return null;
  const [hit] = (await res.json()) as { lat: string; lon: string }[];
  return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
}
