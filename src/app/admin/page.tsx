import Link from "next/link";
import { db } from "@/lib/db";
import { COUNTRIES, countryName } from "@/lib/countries";
import { LEAD_STATUS_LABELS, LEAD_STATUSES } from "@/lib/leads";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Сводка" };

const DAY = 24 * 60 * 60 * 1000;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

function parseDate(raw: unknown, fallback: Date): Date {
  const d = typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00Z`) : null;
  return d && !Number.isNaN(d.getTime()) ? d : fallback;
}

export default async function AdminSummaryPage({ searchParams }: PageProps<"/admin">) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const today = new Date(`${isoDate(new Date())}T00:00:00Z`);
  const from = parseDate(sp.from, new Date(today.getTime() - 6 * DAY));
  const to = parseDate(sp.to, today);
  const country = typeof sp.country === "string" && sp.country ? sp.country : "";
  const end = new Date(to.getTime() + DAY);

  const [venues, groups, leadCounts] = await Promise.all([
    db.venue.findMany({
      where: country ? { country } : {},
      select: { id: true, name: true, city: true, country: true, approved: true },
      orderBy: [{ country: "asc" }, { name: "asc" }],
    }),
    db.order.groupBy({
      by: ["venueId", "status"],
      where: { createdAt: { gte: from, lt: end }, ...(country ? { venue: { country } } : {}) },
      _count: { _all: true },
    }),
    db.lead.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const stats = new Map<string, { total: number; done: number; cancelled: number }>();
  for (const g of groups) {
    const s = stats.get(g.venueId) ?? { total: 0, done: 0, cancelled: 0 };
    s.total += g._count._all;
    if (g.status === "picked_up") s.done += g._count._all;
    if (g.status === "cancelled") s.cancelled += g._count._all;
    stats.set(g.venueId, s);
  }
  const rows = venues
    .map((v) => ({ ...v, ...(stats.get(v.id) ?? { total: 0, done: 0, cancelled: 0 }) }))
    .sort((a, b) => b.total - a.total);
  const totals = rows.reduce(
    (acc, r) => ({ total: acc.total + r.total, done: acc.done + r.done, cancelled: acc.cancelled + r.cancelled }),
    { total: 0, done: 0, cancelled: 0 },
  );
  const leadsBy = new Map(leadCounts.map((l) => [l.status, l._count._all]));

  return (
    <div className="space-y-8">
      <section>
        <h1 className="sign mb-4 text-[44px]">Сводка</h1>
        <form className="flex flex-wrap items-end gap-3 text-sm">
          <label>
            С
            <input type="date" name="from" defaultValue={isoDate(from)} className="input mt-1" />
          </label>
          <label>
            По
            <input type="date" name="to" defaultValue={isoDate(to)} className="input mt-1" />
          </label>
          <label>
            Страна
            <select name="country" defaultValue={country} className="input mt-1">
              <option value="">Все</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn-secondary">Показать</button>
        </form>
        <p className="mt-2 text-xs text-muted">Даты — по UTC.</p>
      </section>

      <section className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2 pr-4">Заведение</th>
              <th className="py-2 pr-4">Страна</th>
              <th className="py-2 pr-4 text-right">Заказов</th>
              <th className="py-2 pr-4 text-right">Выдано</th>
              <th className="py-2 text-right">Отменено</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="py-2 pr-4">
                  <Link href={`/admin/venues/${r.id}`} className="hover:text-chili">
                    {r.name}
                  </Link>
                  <span className="text-muted"> · {r.city}</span>
                  {!r.approved && <span className="ml-2 text-xs text-chili">не одобрено</span>}
                </td>
                <td className="py-2 pr-4">{countryName(r.country)}</td>
                <td className="py-2 pr-4 text-right font-medium">{r.total}</td>
                <td className="py-2 pr-4 text-right">{r.done}</td>
                <td className="py-2 text-right">{r.cancelled}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-line font-semibold">
              <td className="py-2 pr-4">Итого</td>
              <td />
              <td className="py-2 pr-4 text-right">{totals.total}</td>
              <td className="py-2 pr-4 text-right">{totals.done}</td>
              <td className="py-2 text-right">{totals.cancelled}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Заявки</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {LEAD_STATUSES.map((s) => (
            <Link
              key={s}
              href="/admin/leads"
              className="rounded-lg border border-line bg-white px-3 py-2 hover:border-board"
            >
              {LEAD_STATUS_LABELS[s]}: <b>{leadsBy.get(s) ?? 0}</b>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
