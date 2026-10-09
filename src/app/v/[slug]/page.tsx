import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { db } from "@/lib/db";
import { isOpenAt, todayHoursLabel } from "@/lib/hours";
import { getVenueMenu } from "@/lib/menu";
import { VenueMenu } from "./VenueMenu";

export async function generateMetadata({ params }: PageProps<"/v/[slug]">) {
  const { slug } = await params;
  const venue = await db.venue.findUnique({ where: { slug }, select: { name: true } });
  return { title: venue?.name ?? "Заведение" };
}

export default async function VenuePage({ params }: PageProps<"/v/[slug]">) {
  const { slug } = await params;
  const venue = await db.venue.findUnique({ where: { slug }, include: { hours: true } });
  if (!venue?.approved) notFound();

  const menu = await getVenueMenu(venue.id);
  const open = isOpenAt(venue.hours, venue.timezone);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold">{venue.name}</h1>
        <p className="text-neutral-600">
          {venue.city}, {venue.address}
        </p>
        <p className="text-sm text-neutral-500">
          Сегодня: {todayHoursLabel(venue.hours, venue.timezone)} ·{" "}
          {open ? <span className="text-green-700">открыто</span> : <span className="text-red-600">закрыто</span>}
        </p>
        <VenueMenu slug={venue.slug} currency={venue.currency} menu={menu} canOrder={open && menu.length > 0} />
      </main>
    </>
  );
}
