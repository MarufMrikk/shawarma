import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireRole();
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "OWNER") redirect("/owner");
  redirect("/kitchen");
}
