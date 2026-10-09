import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { db } from "@/lib/db";
import { openUntilLabel, todayHoursLabel } from "@/lib/hours";
import { getVenueMenu } from "@/lib/menu";
import { VenueMenu } from "./VenueMenu";

export async function generateMetadata({ params }: PageProps<"/v/[slug]">) {
  const { slug } = await params;
  const venue = await db.venue.findUnique({ where: { slug }, select: { name: true } });
  return { title: venue?.name ?? "Шавермная" };
}

export default async function VenuePage({ params }: PageProps<"/v/[slug]">) {
  const { slug } = await params;
  const venue = await db.venue.findUnique({ where: { slug }, include: { hours: true } });
  if (!venue?.approved) notFound();

  const menu = await getVenueMenu(venue.id);
  const openUntil = openUntilLabel(venue.hours, venue.timezone);

  return (
    <>
      <SiteHeader />
      <section className="border-b-2 border-board bg-kiosk text-board">
        <div className="mx-auto max-w-6xl px-4 pb-7 pt-4">
          <Link href="/" className="text-sm font-semibold underline-offset-4 hover:underline">
            Все шавермные на карте
          </Link>
          <h1 className="sign mt-5 text-[64px] sm:text-[88px]">{venue.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px]">
            <span className="font-medium">{venue.address}</span>
            {openUntil ? (
              <span className="rounded-md bg-board px-2.5 py-1 text-sm font-semibold text-kiosk">Открыто {openUntil}</span>
            ) : (
              <span className="rounded-md bg-chili px-2.5 py-1 text-sm font-semibold text-white">
                Сейчас закрыто, сегодня {todayHoursLabel(venue.hours, venue.timezone)}
              </span>
            )}
            <a href={`tel:${venue.phone}`} className="font-medium underline-offset-4 hover:underline">
              {venue.phone}
            </a>
          </div>
        </div>
      </section>
      <VenueMenu slug={venue.slug} currency={venue.currency} menu={menu} canOrder={!!openUntil && menu.length > 0} />
    </>
  );
}
