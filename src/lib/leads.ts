import type { LeadStatus } from "@/generated/prisma/enums";

export const LEAD_STATUSES: LeadStatus[] = ["lead", "contacted", "negotiation", "connected", "rejected", "paused"];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  lead: "Новая заявка",
  contacted: "Связались",
  negotiation: "Переговоры",
  connected: "Подключено",
  rejected: "Отказ",
  paused: "Пауза",
};
