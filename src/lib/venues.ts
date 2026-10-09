import { db } from "@/lib/db";
import { IS_DEMO } from "@/lib/demo";
import { isOpenAt, openUntilLabel, todayHoursLabel } from "@/lib/hours";

export type VenueCard = {
  slug: string;
  name: string;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  hoursLabel: string;
  currency: string;
  /** cheapest available item of the first menu category (the venue's main dish), minor units */
  minPrice: number | null;
};

/** Venues shown to customers: approved, with at least one available menu item, open right now. */
export async function getVisibleVenues(now: Date = new Date()): Promise<VenueCard[]> {
  const venues = await db.venue.findMany({
    where: { approved: true, items: { some: { available: true } } },
    include: {
      hours: true,
      categories: {
        where: { items: { some: { available: true } } },
        orderBy: { sortOrder: "asc" },
        take: 1,
        include: { items: { where: { available: true }, select: { price: true } } },
      },
    },
    orderBy: { name: "asc" },
  });
  return venues
    // The static demo is built once, so "open right now" would freeze at build time.
    .filter((v) => IS_DEMO || isOpenAt(v.hours, v.timezone, now))
    .map((v) => ({
      slug: v.slug,
      name: v.name,
      city: v.city,
      address: v.address,
      lat: v.lat,
      lng: v.lng,
      hoursLabel: IS_DEMO ? todayHoursLabel(v.hours, v.timezone, now) : (openUntilLabel(v.hours, v.timezone, now) ?? ""),
      currency: v.currency,
      minPrice: v.categories[0]?.items.length ? Math.min(...v.categories[0].items.map((i) => i.price)) : null,
    }));
}
