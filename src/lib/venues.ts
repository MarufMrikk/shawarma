import { db } from "@/lib/db";
import { isOpenAt, openUntilLabel } from "@/lib/hours";

export type VenueCard = {
  slug: string;
  name: string;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  hoursLabel: string;
  currency: string;
  /** cheapest available item, minor units */
  minPrice: number | null;
};

/** Venues shown to customers: approved, with at least one available menu item, open right now. */
export async function getVisibleVenues(now: Date = new Date()): Promise<VenueCard[]> {
  const venues = await db.venue.findMany({
    where: { approved: true, items: { some: { available: true } } },
    include: { hours: true, items: { where: { available: true }, select: { price: true } } },
    orderBy: { name: "asc" },
  });
  return venues
    .filter((v) => isOpenAt(v.hours, v.timezone, now))
    .map((v) => ({
      slug: v.slug,
      name: v.name,
      city: v.city,
      address: v.address,
      lat: v.lat,
      lng: v.lng,
      hoursLabel: openUntilLabel(v.hours, v.timezone, now) ?? "",
      currency: v.currency,
      minPrice: v.items.length ? Math.min(...v.items.map((i) => i.price)) : null,
    }));
}
