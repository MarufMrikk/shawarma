"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { countryByCode } from "@/lib/countries";
import { toE164 } from "@/lib/phone";

const leadSchema = z.object({
  venueName: z.string().trim().min(2, "Укажите название").max(100),
  country: z.string().refine((c) => !!countryByCode(c), "Выберите страну"),
  city: z.string().trim().min(2, "Укажите город").max(80),
  address: z.string().trim().min(3, "Укажите адрес").max(200),
  contactName: z.string().trim().min(2, "Укажите контактное лицо").max(80),
  phone: z.string().trim().min(5, "Укажите телефон").max(30),
  email: z.union([z.literal(""), z.string().trim().toLowerCase().email("Неверный email")]),
});

export type ConnectState = { error: string | null; done: boolean };

export async function submitLead(_prev: ConnectState, fd: FormData): Promise<ConnectState> {
  // Honeypot: bots fill every field.
  if (fd.get("website")) return { error: null, done: true };

  const parsed = leadSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Проверьте поля", done: false };
  const phone = toE164(parsed.data.phone);
  if (!phone) return { error: "Неверный номер телефона", done: false };

  await db.lead.create({
    data: { ...parsed.data, phone, email: parsed.data.email || null },
  });
  return { error: null, done: true };
}
