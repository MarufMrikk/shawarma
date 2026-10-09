import type { OrderStatus } from "@/generated/prisma/enums";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новый",
  accepted: "Принят",
  cooking: "Готовится",
  ready: "Готов к выдаче",
  picked_up: "Выдан",
  cancelled: "Отменён",
};

export const TERMINAL_STATUSES: OrderStatus[] = ["picked_up", "cancelled"];

export const ARRIVE_OPTIONS = [15, 30, 45, 60] as const;

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["accepted", "cancelled"],
  accepted: ["cooking", "cancelled"],
  cooking: ["ready", "cancelled"],
  ready: ["picked_up", "cancelled"],
  picked_up: [],
  cancelled: [],
};

export function allowedTransitions(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** The single "forward" step for the kitchen's main button, or null for terminal statuses. */
export function nextStatus(from: OrderStatus): OrderStatus | null {
  return TRANSITIONS[from].find((s) => s !== "cancelled") ?? null;
}

export const NEXT_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  accepted: "Принять",
  cooking: "Готовить",
  ready: "Готово",
  picked_up: "Выдать",
};
