"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { NEXT_ACTION_LABELS, nextStatus } from "@/lib/orderStatus";
import type { OrderStatus } from "@/generated/prisma/enums";
import { changeOrderStatus } from "./actions";

export function OrderActions({ orderId, status, code }: { orderId: string; status: OrderStatus; code: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = nextStatus(status);

  function run(to: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const result = await changeOrderStatus(orderId, to);
      if (result) setError(result);
      router.refresh();
    });
  }

  if (!next) return null;

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <button
          className="btn-primary flex-1"
          disabled={pending}
          onClick={() => {
            if (next === "picked_up" && !window.confirm(`Клиент назвал код ${code}?`)) return;
            run(next);
          }}
        >
          {NEXT_ACTION_LABELS[next]}
        </button>
        <button
          className="btn-secondary text-red-600"
          disabled={pending}
          onClick={() => window.confirm("Отменить заказ?") && run("cancelled")}
        >
          Отменить
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
