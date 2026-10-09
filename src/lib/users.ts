import { db } from "@/lib/db";
import { newInvite } from "@/lib/invite";
import type { Role } from "@/generated/prisma/enums";

/**
 * Creates a venue user with a fresh invite, or re-issues the invite of a not-yet-activated
 * user of the same venue. Returns an error message or null.
 */
export async function inviteVenueUser(venueId: string, email: string, name: string, role: Role): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return "Неверный email";
  const existing = await db.user.findUnique({ where: { email: normalized } });
  if (existing) {
    if (existing.passwordHash || existing.venueId !== venueId) return "Пользователь с таким email уже есть";
    await db.user.update({ where: { id: existing.id }, data: { ...newInvite(), role, name: name || existing.name } });
    return null;
  }
  await db.user.create({ data: { email: normalized, name: name || normalized, role, venueId, ...newInvite() } });
  return null;
}
