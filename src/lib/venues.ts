import { db } from "@/lib/db";
import { isOpenAt, todayHoursLabel } from "@/lib/hours";

export type VenueCard = {
  slug: string;
  name: string;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  hoursLabel: string;
};

/** Venues shown to customers: approved, with at least one available menu item, open right now. */
export async function getVisibleVenues(now: Date = new Date()): Promise<VenueCard[]> {
  const venues = await db.venue.findMany({
    where: { approved: true, items: { some: { available: true } } },
    include: { hours: true },
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
      hoursLabel: todayHoursLabel(v.hours, v.timezone, now),
    }));
}
