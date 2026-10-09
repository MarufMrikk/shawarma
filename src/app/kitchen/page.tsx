import { AutoRefresh } from "@/components/AutoRefresh";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { STATUS_LABELS, TERMINAL_STATUSES } from "@/lib/orderStatus";
import type { ModifierSnapshot } from "@/lib/pricing";
import { requireVenueUser } from "@/lib/session";
import type { OrderStatus } from "@/generated/prisma/enums";
import { OrderActions } from "./OrderActions";

export const metadata = { title: "Кухня" };

const COLUMNS: { title: string; statuses: OrderStatus[] }[] = [
  { title: "Новые", statuses: ["new"] },
  { title: "В работе", statuses: ["accepted", "cooking"] },
  { title: "Готовы к выдаче", statuses: ["ready"] },
];

export default async function KitchenPage() {
  const user = await requireVenueUser("OWNER", "STAFF");
  const venue = await db.venue.findUniqueOrThrow({
    where: { id: user.venueId },
    select: { name: true, timezone: true, currency: true },
  });
  const [active, recent] = await Promise.all([
    db.order.findMany({
      where: { venueId: user.venueId, status: { notIn: TERMINAL_STATUSES } },
      include: { items: true },
      orderBy: { pickupAt: "asc" },
    }),
    db.order.findMany({
      where: { venueId: user.venueId, status: { in: TERMINAL_STATUSES } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { id: true, pickupCode: true, customerName: true, status: true, updatedAt: true },
    }),
  ]);

  const time = new Intl.DateTimeFormat("ru-RU", { timeZone: venue.timezone, hour: "2-digit", minute: "2-digit" });
  const now = Date.now();

  return (
    <>
      <AutoRefresh intervalMs={5000} />
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-xl font-bold">{venue.name}</h1>
        <span className="text-sm text-neutral-500">Обновляется автоматически</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const orders = active.filter((o) => col.statuses.includes(o.status));
          return (
            <section key={col.title} className="rounded-xl bg-neutral-100 p-3">
              <h2 className="mb-3 font-semibold">
                {col.title} <span className="text-neutral-500">{orders.length}</span>
              </h2>
              <div className="space-y-3">
                {orders.map((o) => {
                  const minutesLeft = Math.round((o.pickupAt.getTime() - now) / 60000);
                  return (
                    <article
                      key={o.id}
                      className={`rounded-lg bg-white p-3 shadow-sm ${o.status === "new" ? "ring-2 ring-orange-400" : ""}`}
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold tracking-widest">{o.pickupCode}</span>
                        <span className="text-xs text-neutral-500">{STATUS_LABELS[o.status]}</span>
                      </div>
                      <div className="text-sm">
                        {o.customerName} · <a href={`tel:${o.customerPhone}`}>{o.customerPhone}</a>
                      </div>
                      <div className={`text-sm ${minutesLeft < 0 ? "text-red-600" : "text-neutral-600"}`}>
                        Придёт к {time.format(o.pickupAt)}
                        {minutesLeft >= 0 ? ` (через ${minutesLeft} мин)` : ` (опаздывает на ${-minutesLeft} мин)`}
                      </div>
                      <ul className="mt-2 space-y-1 text-sm">
                        {o.items.map((i) => {
                          const mods = i.modifiers as ModifierSnapshot[];
                          return (
                            <li key={i.id}>
                              <span className="font-medium">
                                {i.quantity} × {i.name}
                              </span>
                              {mods.length > 0 && (
                                <span className="text-neutral-600"> — {mods.map((m) => m.name).join(", ")}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      <div className="mt-1 text-sm text-neutral-500">{formatMoney(o.totalAmount, o.currency)}</div>
                      <OrderActions orderId={o.id} status={o.status} code={o.pickupCode} />
                    </article>
                  );
                })}
                {orders.length === 0 && <p className="text-sm text-neutral-500">Пусто</p>}
              </div>
            </section>
          );
        })}
      </div>

      {recent.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-semibold">Последние завершённые</h2>
          <ul className="text-sm text-neutral-600">
            {recent.map((o) => (
              <li key={o.id}>
                {time.format(o.updatedAt)} · {o.pickupCode} · {o.customerName} · {STATUS_LABELS[o.status]}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
