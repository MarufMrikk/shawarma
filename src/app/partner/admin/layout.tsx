import { StaffHeader } from "@/components/StaffHeader";
import { requireRole } from "@/lib/session";

export default async function AdminLayout({ children }: LayoutProps<"/partner/admin">) {
  const user = await requireRole("ADMIN");
  return (
    <>
      <StaffHeader title="Админка" userName={user.name ?? ""} links={[
          { href: "/partner/admin", label: "Сводка" },
          { href: "/partner/admin/leads", label: "Заявки" },
          { href: "/partner/admin/venues", label: "Заведения" },
          { href: "/partner/admin/orders", label: "Заказы" },
        ]} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
