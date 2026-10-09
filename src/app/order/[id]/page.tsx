import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { SiteHeader } from "@/components/SiteHeader";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { STATUS_LABELS, TERMINAL_STATUSES } from "@/lib/orderStatus";
import type { ModifierSnapshot } from "@/lib/pricing";
import type { OrderStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Заказ" };

const PROGRESS: OrderStatus[] = ["new", "accepted", "cooking", "ready", "picked_up"];

export default async function OrderPage({ params }: PageProps<"/order/[id]">) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, venue: { select: { name: true, slug: true, address: true, city: true, timezone: true } } },
  });
  if (!order) notFound();

  const terminal = TERMINAL_STATUSES.includes(order.status);
  const step = PROGRESS.indexOf(order.status);
  const pickupTime = new Intl.DateTimeFormat("ru-RU", {
    timeZone: order.venue.timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(order.pickupAt);

  return (
    <>
      <SiteHeader />
      <AutoRefresh intervalMs={8000} enabled={!terminal} />
      <main className="mx-auto w-full max-w-lg px-4 py-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center">
          <div className="text-sm text-neutral-500">Код получения</div>
          <div className="my-2 text-6xl font-bold tracking-[0.3em] text-orange-600">{order.pickupCode}</div>
          <div className="text-sm text-neutral-600">Назовите код повару при получении</div>
          <div
            className={`mt-4 inline-block rounded-full px-4 py-1 text-sm font-semibold ${
              order.status === "cancelled"
                ? "bg-red-100 text-red-700"
                : order.status === "ready"
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
            }`}
          >
            {STATUS_LABELS[order.status]}
          </div>
          {order.status !== "cancelled" && (
            <div className="mt-4 flex gap-1">
              {PROGRESS.map((s, i) => (
                <div key={s} className={`h-1.5 flex-1 rounded ${i <= step ? "bg-orange-500" : "bg-neutral-200"}`} />
              ))}
            </div>
          )}
        </div>

        <section className="mt-6 space-y-1 text-sm">
          <div>
            <Link href={`/v/${order.venue.slug}`} className="font-semibold hover:text-orange-600">
              {order.venue.name}
            </Link>
          </div>
          <div className="text-neutral-600">
            {order.venue.city}, {order.venue.address}
          </div>
          <div className="text-neutral-600">Ждём вас к {pickupTime}</div>
        </section>

        <ul className="mt-6 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white text-sm">
          {order.items.map((item) => {
            const modifiers = item.modifiers as ModifierSnapshot[];
            return (
              <li key={item.id} className="flex justify-between gap-2 p-3">
                <div>
                  <div>
                    {item.name} × {item.quantity}
                  </div>
                  {modifiers.length > 0 && (
                    <div className="text-neutral-500">{modifiers.map((m) => m.name).join(", ")}</div>
                  )}
                </div>
                <div className="shrink-0">{formatMoney(item.lineTotal, order.currency)}</div>
              </li>
            );
          })}
          <li className="flex justify-between p-3 font-semibold">
            <span>Итого</span>
            <span>{formatMoney(order.totalAmount, order.currency)}</span>
          </li>
        </ul>
        <p className="mt-3 text-xs text-neutral-500">Оплата при получении. Сохраните ссылку на эту страницу.</p>
      </main>
    </>
  );
}
