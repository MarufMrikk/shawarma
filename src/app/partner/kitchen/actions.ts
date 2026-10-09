"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { canTransition } from "@/lib/orderStatus";
import { requireVenueUser } from "@/lib/session";
import { OrderStatus } from "@/generated/prisma/enums";

export async function changeOrderStatus(orderId: string, to: OrderStatus): Promise<string | null> {
  const user = await requireVenueUser("OWNER", "STAFF");
  if (!Object.values(OrderStatus).includes(to)) return "Неизвестный статус";

  const order = await db.order.findFirst({
    where: { id: orderId, venueId: user.venueId },
    select: { status: true },
  });
  if (!order) return "Заказ не найден";
  if (!canTransition(order.status, to)) return "Статус уже изменён";

  // Conditional update guards against two devices changing the same order concurrently.
  const { count } = await db.order.updateMany({
    where: { id: orderId, venueId: user.venueId, status: order.status },
    data: { status: to },
  });

  revalidatePath("/partner/kitchen");
  return count === 1 ? null : "Статус уже изменён";
}
