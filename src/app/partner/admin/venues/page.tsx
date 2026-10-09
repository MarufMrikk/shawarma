import Link from "next/link";
import { db } from "@/lib/db";
import { COUNTRIES, countryName } from "@/lib/countries";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Заведения" };

export default async function AdminVenuesPage({ searchParams }: PageProps<"/partner/admin/venues">) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const country = typeof sp.country === "string" ? sp.country : "";

  const venues = await db.venue.findMany({
    where: country ? { country } : {},
    orderBy: [{ country: "asc" }, { name: "asc" }],
    include: { _count: { select: { items: { where: { available: true } }, orders: true, hours: true } } },
  });

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="sign text-[44px]">Заведения</h1>
        <form className="flex items-end gap-2 text-sm">
          <select name="country" defaultValue={country} className="input">
            <option value="">Все страны</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <button className="btn-secondary">Фильтр</button>
        </form>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2 pr-4">Заведение</th>
              <th className="py-2 pr-4">Страна</th>
              <th className="py-2 pr-4">Валюта</th>
              <th className="py-2 pr-4">Комиссия</th>
              <th className="py-2 pr-4">Меню</th>
              <th className="py-2 pr-4">Заказов</th>
              <th className="py-2">Статус</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((v) => (
              <tr key={v.id} className="border-t border-line">
                <td className="py-2 pr-4">
                  <Link href={`/partner/admin/venues/${v.id}`} className="font-medium hover:text-chili">
                    {v.name}
                  </Link>
                  <div className="text-muted">
                    {v.city}, {v.address}
                  </div>
                </td>
                <td className="py-2 pr-4">{countryName(v.country)}</td>
                <td className="py-2 pr-4">{v.currency}</td>
                <td className="py-2 pr-4">{v.commissionPercent.toString()}%</td>
                <td className="py-2 pr-4">{v._count.items}</td>
                <td className="py-2 pr-4">{v._count.orders}</td>
                <td className="py-2">
                  {v.approved ? (
                    <span className="text-herb">одобрено</span>
                  ) : (
                    <span className="text-chili">не одобрено</span>
                  )}
                  {v._count.items === 0 && <div className="text-xs text-muted">нет меню</div>}
                  {v._count.hours === 0 && <div className="text-xs text-muted">нет часов</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {venues.length === 0 && <p className="text-muted">Нет заведений.</p>}
      </div>
    </section>
  );
}
