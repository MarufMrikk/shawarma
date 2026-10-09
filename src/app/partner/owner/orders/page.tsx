import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { STATUS_LABELS } from "@/lib/orderStatus";
import { requireVenueUser } from "@/lib/session";

export const metadata = { title: "Заказы" };

const PAGE_SIZE = 50;

export default async function OwnerOrdersPage({ searchParams }: PageProps<"/partner/owner/orders">) {
  const user = await requireVenueUser("OWNER");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const venue = await db.venue.findUniqueOrThrow({ where: { id: user.venueId }, select: { timezone: true } });

  const orders = await db.order.findMany({
    where: { venueId: user.venueId },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1,
    include: { items: { select: { name: true, quantity: true } } },
  });
  const hasNext = orders.length > PAGE_SIZE;
  const fmt = new Intl.DateTimeFormat("ru-RU", { timeZone: venue.timezone, dateStyle: "short", timeStyle: "short" });

  return (
    <section>
      <h1 className="sign mb-4 text-[44px]">Заказы</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2 pr-4">Создан</th>
              <th className="py-2 pr-4">Код</th>
              <th className="py-2 pr-4">Клиент</th>
              <th className="py-2 pr-4">Состав</th>
              <th className="py-2 pr-4">Сумма</th>
              <th className="py-2">Статус</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, PAGE_SIZE).map((o) => (
              <tr key={o.id} className="border-t border-line align-top">
                <td className="py-2 pr-4 whitespace-nowrap">{fmt.format(o.createdAt)}</td>
                <td className="py-2 pr-4 font-mono">{o.pickupCode}</td>
                <td className="py-2 pr-4">
                  {o.customerName}
                  <div className="text-muted">{o.customerPhone}</div>
                </td>
                <td className="py-2 pr-4">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{formatMoney(o.totalAmount, o.currency)}</td>
                <td className="py-2">{STATUS_LABELS[o.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="text-muted">Заказов пока нет.</p>}
      </div>
      <div className="mt-4 flex gap-4 text-sm">
        {page > 1 && <Link href={`/partner/owner/orders?page=${page - 1}`}>← Назад</Link>}
        {hasNext && <Link href={`/partner/owner/orders?page=${page + 1}`}>Дальше</Link>}
      </div>
    </section>
  );
}
