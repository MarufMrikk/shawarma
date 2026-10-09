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

  const hint: Record<OrderStatus, string> = {
    new: "Шавермная получила заказ и скоро его примет.",
    accepted: "Заказ принят. Начнут готовить к вашему приходу.",
    cooking: "Готовим вашу шаверму.",
    ready: "Всё готово — подходите и назовите код.",
    picked_up: "Заказ выдан. Приятного аппетита!",
    cancelled: "Заказ отменён шавермной. Позвоните им, если есть вопросы.",
  };

  return (
    <>
      <SiteHeader />
      <AutoRefresh intervalMs={8000} enabled={!terminal} />
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <div className="receipt rounded-t-3xl px-6 pt-6 shadow-[0_10px_30px_rgba(42,31,61,.08)]">
          <div className="text-center">
            <p className="text-sm text-muted">Код для получения</p>
            <div className="mx-auto mt-2 inline-block rounded-2xl bg-turmeric px-6 py-3 font-display text-6xl font-extrabold tracking-[0.12em] text-board">
              {order.pickupCode}
            </div>
            <p
              className={`mt-5 font-display text-xl font-bold ${
                order.status === "cancelled" ? "text-chili" : order.status === "ready" ? "text-herb" : "text-board"
              }`}
            >
              {STATUS_LABELS[order.status]}
            </p>
            <p className="mt-1 text-sm text-muted">{hint[order.status]}</p>
          </div>

          {order.status !== "cancelled" && (
            <ol className="mt-5 grid grid-cols-5 gap-1" aria-label="Ход заказа">
              {PROGRESS.map((s, i) => (
                <li key={s} className={`h-1.5 rounded-full ${i <= step ? "bg-chili" : "bg-line"}`}>
                  <span className="sr-only">{STATUS_LABELS[s]}</span>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-6 border-t-2 border-dashed border-line pt-4 text-sm">
            <Link href={`/v/${order.venue.slug}`} className="font-semibold hover:text-chili">
              {order.venue.name}
            </Link>
            <div className="text-muted">{order.venue.address}</div>
            <div className="mt-1">
              Ждём вас к <b>{pickupTime}</b>
            </div>
          </div>

          <ul className="mt-4 divide-y divide-dashed divide-line border-t-2 border-dashed border-line text-sm">
            {order.items.map((item) => {
              const modifiers = item.modifiers as ModifierSnapshot[];
              return (
                <li key={item.id} className="flex justify-between gap-3 py-2.5">
                  <div>
                    <div>
                      {item.name} × {item.quantity}
                    </div>
                    {modifiers.length > 0 && (
                      <div className="text-muted">{modifiers.map((m) => m.name).join(", ")}</div>
                    )}
                  </div>
                  <div className="shrink-0">{formatMoney(item.lineTotal, order.currency)}</div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-baseline justify-between border-t-2 border-dashed border-line pt-3">
            <span className="font-semibold">Итого</span>
            <span className="font-display text-xl font-bold">{formatMoney(order.totalAmount, order.currency)}</span>
          </div>
          <p className="mt-2 text-xs text-muted">Оплата в шавермной при получении.</p>
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          Статус обновляется сам. Сохраните ссылку на эту страницу, чтобы вернуться к заказу.
        </p>
      </main>
    </>
  );
}
