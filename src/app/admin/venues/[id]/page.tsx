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

export default async function AdminVenuePage({ params }: PageProps<"/admin/venues/[id]">) {
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
      <Link href="/admin/venues" className="text-sm text-neutral-600 hover:text-orange-600">
        ← Заведения
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-neutral-200 bg-white p-4">
          <h1 className="text-xl font-bold">{venue.name}</h1>
          <p className="text-sm text-neutral-600">
            {countryName(venue.country)}, {venue.city}, {venue.address} · {venue.phone}
          </p>
          <p className="mt-1 text-sm">
            Сейчас на карте:{" "}
            {visible ? <span className="text-green-700">да</span> : <span className="text-red-600">нет</span>} · позиций
            в меню: {venue._count.items} · заказов: {venue._count.orders}
          </p>
          <div className="mt-1 flex gap-4 text-sm">
            <Link href={`/v/${venue.slug}`} className="text-orange-600 underline">
              /v/{venue.slug}
            </Link>
            {venue.lead && (
              <Link href={`/admin/leads/${venue.lead.id}`} className="text-orange-600 underline">
                Заявка
              </Link>
            )}
            <Link href={`/admin/orders?venue=${venue.id}`} className="text-orange-600 underline">
              Заказы
            </Link>
          </div>

          <ActionForm action={updateVenueAdmin} className="mt-4 space-y-3 border-t border-neutral-100 pt-4 text-sm">
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
