import { customerUrl } from "@/lib/siteUrl";
import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { VenueUsers } from "@/components/VenueUsers";
import { db } from "@/lib/db";
import { isOpenAt } from "@/lib/hours";
import { requireVenueUser } from "@/lib/session";
import { inviteStaff, removeStaff, updateVenueInfo } from "./actions";

export const metadata = { title: "Заведение" };

export default async function OwnerPage() {
  const user = await requireVenueUser("OWNER");
  const venue = await db.venue.findUniqueOrThrow({
    where: { id: user.venueId },
    include: { hours: true, _count: { select: { items: { where: { available: true } } } } },
  });

  const checks = [
    { ok: venue.approved, label: "Заведение одобрено платформой" },
    { ok: venue._count.items > 0, label: "В меню есть доступные позиции", href: "/partner/owner/menu" },
    { ok: venue.hours.length > 0, label: "Заполнены часы работы", href: "/partner/owner/hours" },
    { ok: venue.lat !== null, label: "Адрес найден на карте" },
    { ok: isOpenAt(venue.hours, venue.timezone), label: "Сейчас открыто" },
  ];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section>
        <h1 className="sign mb-4 text-[44px]">Заведение</h1>
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
        <dl className="mt-6 grid grid-cols-2 gap-1 text-sm text-muted">
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
              <span className={c.ok ? "text-herb" : "text-chili"}>{c.ok ? "✓" : "✗"}</span>
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
          <a href={customerUrl(`/v/${venue.slug}`)} className="mt-4 inline-block text-sm text-chili underline">
            Страница заведения для клиентов
          </a>
        )}
      </section>

      <section className="md:col-span-2">
        <h2 className="mb-3 text-lg font-semibold">Сотрудники</h2>
        <VenueUsers venueId={venue.id} inviteAction={inviteStaff} removeAction={removeStaff} allowOwnerRole={false} />
      </section>
    </div>
  );
}
