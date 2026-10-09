import { customerUrl } from "@/lib/siteUrl";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { VenueUsers } from "@/components/VenueUsers";
import { db } from "@/lib/db";
import { countryName } from "@/lib/countries";
import { isOpenAt } from "@/lib/hours";
import { requireRole } from "@/lib/session";
import { adminInviteUser, updateVenueAdmin } from "../../actions";

export const metadata = { title: "Заведение" };

export default async function AdminVenuePage({ params }: PageProps<"/partner/admin/venues/[id]">) {
  await requireRole("ADMIN");
  const { id } = await params;
  const venue = await db.venue.findUnique({
    where: { id },
    include: {
      hours: true,
      lead: { select: { id: true } },
      _count: { select: { items: { where: { available: true } }, orders: true } },
    },
  });
  if (!venue) notFound();

  const visible = venue.approved && venue._count.items > 0 && isOpenAt(venue.hours, venue.timezone);

  return (
    <div className="space-y-8">
      <Link href="/partner/admin/venues" className="text-sm text-muted hover:text-chili">
        ← Заведения
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-white p-4">
          <h1 className="sign text-[44px]">{venue.name}</h1>
          <p className="text-sm text-muted">
            {countryName(venue.country)}, {venue.city}, {venue.address} · {venue.phone}
          </p>
          <p className="mt-1 text-sm">
            Сейчас на карте:{" "}
            {visible ? <span className="text-herb">да</span> : <span className="text-chili">нет</span>} · позиций
            в меню: {venue._count.items} · заказов: {venue._count.orders}
          </p>
          <div className="mt-1 flex gap-4 text-sm">
            <a href={customerUrl(`/v/${venue.slug}`)} className="text-chili underline">
              /v/{venue.slug}
            </a>
            {venue.lead && (
              <Link href={`/partner/admin/leads/${venue.lead.id}`} className="text-chili underline">
                Заявка
              </Link>
            )}
            <Link href={`/partner/admin/orders?venue=${venue.id}`} className="text-chili underline">
              Заказы
            </Link>
          </div>

          <ActionForm action={updateVenueAdmin} className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
            <input type="hidden" name="id" value={venue.id} />
            <label className="flex items-center gap-2">
              <input type="checkbox" name="approved" defaultChecked={venue.approved} />
              Одобрено (без одобрения не показывается клиентам)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                Валюта
                <input name="currency" defaultValue={venue.currency} className="input mt-1" required />
              </label>
              <label className="col-span-2 block">
                Часовой пояс
                <input name="timezone" defaultValue={venue.timezone} className="input mt-1" required />
              </label>
            </div>
            <label className="block">
              Комиссия платформы, %
              <input
                name="commission"
                defaultValue={venue.commissionPercent.toString()}
                className="input mt-1 w-32"
                inputMode="decimal"
                required
              />
            </label>
            <SubmitButton>Сохранить</SubmitButton>
          </ActionForm>
        </section>

        <section>
          <h2 className="mb-3 font-semibold">Сотрудники</h2>
          <VenueUsers venueId={venue.id} inviteAction={adminInviteUser} allowOwnerRole />
        </section>
      </div>
    </div>
  );
}
