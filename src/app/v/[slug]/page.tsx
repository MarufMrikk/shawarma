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
      <section className="bg-board text-white">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-5">
          <Link href="/" className="text-sm text-white/60 hover:text-white">
            ← Все шавермные на карте
          </Link>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.1] sm:text-4xl">{venue.name}</h1>
          <p className="mt-2 text-white/75">{venue.address}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            {openUntil ? (
              <span className="rounded-full bg-herb px-3 py-1 font-semibold">Открыто {openUntil}</span>
            ) : (
              <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">
                Сейчас закрыто, сегодня {todayHoursLabel(venue.hours, venue.timezone)}
              </span>
            )}
            <a href={`tel:${venue.phone}`} className="text-white/75 hover:text-white">
              {venue.phone}
            </a>
          </div>
        </div>
      </section>
      <VenueMenu slug={venue.slug} currency={venue.currency} menu={menu} canOrder={!!openUntil && menu.length > 0} />
    </>
  );
}
