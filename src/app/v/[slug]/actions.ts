"use server";

import { randomInt } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { isOpenAt } from "@/lib/hours";
import { getVenueMenu } from "@/lib/menu";
import { ARRIVE_OPTIONS } from "@/lib/orderStatus";
import { toE164 } from "@/lib/phone";
import { priceLine } from "@/lib/pricing";

const orderSchema = z.object({
  slug: z.string().min(1),
  name: z.string().trim().min(1, "Укажите имя").max(60),
  phone: z.string().trim().min(5, "Укажите телефон").max(30),
  arriveInMinutes: z.number().refine((n) => (ARRIVE_OPTIONS as readonly number[]).includes(n)),
  lines: z
    .array(
      z.object({
        itemId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
        optionIds: z.array(z.string()).max(20),
      }),
    )
    .min(1, "Корзина пуста")
    .max(30),
});

export type PlaceOrderInput = z.infer<typeof orderSchema>;
export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; error: string };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  const data = parsed.data;

  const phone = toE164(data.phone);
  if (!phone) return { ok: false, error: "Неверный номер телефона" };

  const venue = await db.venue.findUnique({ where: { slug: data.slug }, include: { hours: true } });
  if (!venue?.approved) return { ok: false, error: "Заведение не найдено" };
  if (!isOpenAt(venue.hours, venue.timezone)) return { ok: false, error: "Заведение сейчас закрыто" };

  const menu = await getVenueMenu(venue.id);
  const itemsById = new Map(menu.flatMap((c) => c.items).map((i) => [i.id, i]));

  const orderItems = [];
  for (const line of data.lines) {
    const item = itemsById.get(line.itemId);
    if (!item) return { ok: false, error: "Позиция больше недоступна, обновите страницу" };
    const priced = priceLine(item, line.optionIds);
    if (!priced.ok) return { ok: false, error: `${item.name}: ${priced.error}` };
    orderItems.push({
      name: item.name,
      unitPrice: priced.unitPrice,
      quantity: line.quantity,
      modifiers: priced.modifiers,
      lineTotal: priced.unitPrice * line.quantity,
    });
  }

  const order = await db.order.create({
    data: {
      venueId: venue.id,
      customerName: data.name,
      customerPhone: phone,
      arriveInMinutes: data.arriveInMinutes,
      pickupAt: new Date(Date.now() + data.arriveInMinutes * 60_000),
      pickupCode: String(randomInt(0, 10_000)).padStart(4, "0"),
      currency: venue.currency,
      totalAmount: orderItems.reduce((s, i) => s + i.lineTotal, 0),
      items: { create: orderItems },
    },
    select: { id: true },
  });

  return { ok: true, orderId: order.id };
}
