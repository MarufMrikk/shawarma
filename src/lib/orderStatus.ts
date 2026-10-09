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
