"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { demoStatus, loadDemoOrder, type DemoOrder } from "@/lib/demo";
import { formatMoney } from "@/lib/money";
import { STATUS_LABELS } from "@/lib/orderStatus";
import type { OrderStatus } from "@/generated/prisma/enums";

const PROGRESS: OrderStatus[] = ["new", "accepted", "cooking", "ready", "picked_up"];

const HINT: Record<OrderStatus, string> = {
  new: "Шавермная получила заказ и скоро его примет.",
  accepted: "Заказ принят. Начнут готовить к вашему приходу.",
  cooking: "Готовим вашу шаверму.",
  ready: "Всё готово — подходите и назовите код.",
  picked_up: "Заказ выдан. Приятного аппетита!",
  cancelled: "Заказ отменён шавермной.",
};

/** Order ticket for the static demo: reads the order from localStorage, simulates the kitchen. */
function DemoTicket() {
  const id = useSearchParams().get("id") ?? "";
  const [order, setOrder] = useState<DemoOrder | null | undefined>(undefined);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setOrder(loadDemoOrder(id));
    const t = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(t);
  }, [id]);

  if (order === undefined) return null;
  if (order === null) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-16 text-center">
        <p className="font-semibold">Заказ не найден в этом браузере.</p>
        <Link href="/" className="mt-3 inline-block font-semibold underline underline-offset-4">
          Выбрать шавермную на карте
        </Link>
      </main>
    );
  }

  const status = demoStatus(order, now);
  const step = PROGRESS.indexOf(status);
  const pickupTime = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
  }).format(order.pickupAt);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <div className="receipt rounded-t-lg border-x-2 border-t-2 border-board px-6 pt-6">
        <div className="text-center">
          <p className="text-sm text-muted">Код для получения</p>
          <div className="sign mx-auto mt-2 inline-block rounded-lg border-2 border-board bg-kiosk px-7 pb-2 pt-4 text-[112px] tracking-[0.06em] text-board shadow-[5px_5px_0_#26211c]">
            {order.pickupCode}
          </div>
          <p className={`sign mt-6 text-[40px] ${status === "ready" ? "text-herb" : "text-board"}`}>
            {STATUS_LABELS[status]}
          </p>
          <p className="mt-1 text-sm text-muted">{HINT[status]}</p>
        </div>

        <ol className="mt-5 grid grid-cols-5 gap-1" aria-label="Ход заказа">
          {PROGRESS.map((s, i) => (
            <li key={s} className={`h-1.5 rounded-full ${i <= step ? "bg-chili" : "bg-line"}`}>
              <span className="sr-only">{STATUS_LABELS[s]}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 border-t-2 border-dashed border-line pt-4 text-sm">
          <Link href={`/v/${order.venueSlug}`} className="font-semibold hover:text-chili">
            {order.venueName}
          </Link>
          <div className="text-muted">{order.venueAddress}</div>
          <div className="mt-1">
            Ждём вас к <b>{pickupTime}</b>
          </div>
        </div>

        <ul className="mt-4 divide-y divide-dashed divide-line border-t-2 border-dashed border-line text-sm">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3 py-2.5">
              <div>
                <div>
                  {item.name} × {item.quantity}
                </div>
                {item.modifiers.length > 0 && (
                  <div className="text-muted">{item.modifiers.map((m) => m.name).join(", ")}</div>
                )}
              </div>
              <div className="shrink-0">{formatMoney(item.lineTotal, order.currency)}</div>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between border-t-2 border-dashed border-line pt-3">
          <span className="font-semibold">Итого</span>
          <span className="sign text-[34px]">{formatMoney(order.totalAmount, order.currency)}</span>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted">
        Демо-версия: заказ сохранён только в этом браузере, статус меняется автоматически.
      </p>
    </main>
  );
}

export default function DemoOrderPage() {
  return (
    <>
      <SiteHeader />
      <Suspense>
        <DemoTicket />
      </Suspense>
    </>
  );
}
