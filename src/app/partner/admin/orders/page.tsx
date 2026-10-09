import { customerUrl } from "@/lib/siteUrl";
import Link from "next/link";
import { db } from "@/lib/db";
import { COUNTRIES } from "@/lib/countries";
import { formatMoney } from "@/lib/money";
import { STATUS_LABELS } from "@/lib/orderStatus";
import { requireRole } from "@/lib/session";
import { OrderStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Заказы" };

const PAGE_SIZE = 50;
const fmt = new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" });

export default async function AdminOrdersPage({ searchParams }: PageProps<"/partner/admin/orders">) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const country = one(sp.country);
  const venueId = one(sp.venue);
  const status = one(sp.status) as OrderStatus | "";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(venueId ? { venueId } : {}),
    ...(country ? { venue: { country } } : {}),
    ...(status && Object.values(OrderStatus).includes(status) ? { status } : {}),
  };

  const [orders, venues] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE + 1,
      include: { venue: { select: { name: true, country: true } } },
    }),
    db.venue.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const hasNext = orders.length > PAGE_SIZE;
  const qs = (p: number) => {
    const params = new URLSearchParams({ country, venue: venueId, status, page: String(p) });
    return `/partner/admin/orders?${params}`;
  };

  return (
    <section>
      <h1 className="sign mb-4 text-[44px]">Заказы</h1>
      <form className="mb-4 flex flex-wrap items-end gap-2 text-sm">
        <select name="country" defaultValue={country} className="input w-auto">
          <option value="">Все страны</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="venue" defaultValue={venueId} className="input w-auto">
          <option value="">Все заведения</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status} className="input w-auto">
          <option value="">Все статусы</option>
          {Object.values(OrderStatus).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button className="btn-secondary">Фильтр</button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2 pr-4">Создан (UTC)</th>
              <th className="py-2 pr-4">Заведение</th>
              <th className="py-2 pr-4">Клиент</th>
              <th className="py-2 pr-4">Сумма</th>
              <th className="py-2 pr-4">Статус</th>
              <th className="py-2">Оплата</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, PAGE_SIZE).map((o) => (
              <tr key={o.id} className="border-t border-line">
                <td className="py-2 pr-4 whitespace-nowrap">
                  <a href={customerUrl(`/order/${o.id}`)} className="hover:text-chili">
                    {fmt.format(o.createdAt)}
                  </a>
                </td>
                <td className="py-2 pr-4">
                  {o.venue.name} <span className="text-muted">({o.venue.country})</span>
                </td>
                <td className="py-2 pr-4">
                  {o.customerName} <span className="text-muted">{o.customerPhone}</span>
                </td>
                <td className="py-2 pr-4 whitespace-nowrap">{formatMoney(o.totalAmount, o.currency)}</td>
                <td className="py-2 pr-4">{STATUS_LABELS[o.status]}</td>
                <td className="py-2 text-muted">{o.paymentStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="text-muted">Заказов нет.</p>}
      </div>
      <div className="mt-4 flex gap-4 text-sm">
        {page > 1 && <Link href={qs(page - 1)}>← Назад</Link>}
        {hasNext && <Link href={qs(page + 1)}>Дальше</Link>}
      </div>
    </section>
  );
}
