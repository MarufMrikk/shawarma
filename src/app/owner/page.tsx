import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { db } from "@/lib/db";
import { isOpenAt } from "@/lib/hours";
import { requireVenueUser } from "@/lib/session";
import { updateVenueInfo } from "./actions";

export const metadata = { title: "Заведение" };

export default async function OwnerPage() {
  const user = await requireVenueUser("OWNER");
  const venue = await db.venue.findUniqueOrThrow({
    where: { id: user.venueId },
    include: { hours: true, _count: { select: { items: { where: { available: true } } } } },
  });

  const checks = [
    { ok: venue.approved, label: "Заведение одобрено платформой" },
    { ok: venue._count.items > 0, label: "В меню есть доступные позиции", href: "/owner/menu" },
    { ok: venue.hours.length > 0, label: "Заполнены часы работы", href: "/owner/hours" },
    { ok: venue.lat !== null, label: "Адрес найден на карте" },
    { ok: isOpenAt(venue.hours, venue.timezone), label: "Сейчас открыто" },
  ];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section>
        <h1 className="mb-4 text-xl font-bold">Заведение</h1>
        <ActionForm action={updateVenueInfo} className="space-y-3">
          <label className="block text-sm">
            Название
            <input name="name" defaultValue={venue.name} className="input mt-1" required />
          </label>
          <label className="block text-sm">
            Город
            <input name="city" defaultValue={venue.city} className="input mt-1" required />
          </label>
          <label className="block text-sm">
            Адрес
            <input name="address" defaultValue={venue.address} className="input mt-1" required />
          </label>
          <label className="block text-sm">
            Телефон
            <input name="phone" defaultValue={venue.phone} className="input mt-1" required type="tel" />
          </label>
          <SubmitButton>Сохранить</SubmitButton>
        </ActionForm>
        <dl className="mt-6 grid grid-cols-2 gap-1 text-sm text-neutral-600">
          <dt>Страна</dt>
          <dd>{venue.country}</dd>
          <dt>Валюта</dt>
          <dd>{venue.currency}</dd>
          <dt>Часовой пояс</dt>
          <dd>{venue.timezone}</dd>
          <dt>Координаты</dt>
          <dd>{venue.lat !== null ? `${venue.lat.toFixed(5)}, ${venue.lng?.toFixed(5)}` : "—"}</dd>
        </dl>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Видимость на карте</h2>
        <ul className="space-y-2 text-sm">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2">
              <span className={c.ok ? "text-green-600" : "text-red-600"}>{c.ok ? "✓" : "✗"}</span>
              {c.href && !c.ok ? (
                <Link href={c.href} className="underline">
                  {c.label}
                </Link>
              ) : (
                <span>{c.label}</span>
              )}
            </li>
          ))}
        </ul>
        {venue.approved && (
          <Link href={`/v/${venue.slug}`} className="mt-4 inline-block text-sm text-orange-600 underline">
            Страница заведения для клиентов →
          </Link>
        )}
      </section>
    </div>
  );
}
