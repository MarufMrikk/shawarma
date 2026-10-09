import { StaffHeader } from "@/components/StaffHeader";
import { requireRole } from "@/lib/session";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireRole("ADMIN");
  return (
    <>
      <StaffHeader title="Админка" userName={user.name ?? ""} links={[{ href: "/admin", label: "Сводка" }]} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
