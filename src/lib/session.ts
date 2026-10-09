import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/enums";

/** Returns the session user or redirects to /login if missing or not in one of the roles. */
export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (roles.length > 0 && !roles.includes(session.user.role)) redirect("/dashboard");
  return session.user;
}

/** Like requireRole for venue staff, but also guarantees a venueId. */
export async function requireVenueUser(...roles: Role[]) {
  const user = await requireRole(...roles);
  if (!user.venueId) redirect("/login");
  return { ...user, venueId: user.venueId };
}
