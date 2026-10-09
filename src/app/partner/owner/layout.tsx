import { StaffHeader } from "@/components/StaffHeader";
import { requireVenueUser } from "@/lib/session";

export default async function OwnerLayout({ children }: LayoutProps<"/partner/owner">) {
  const user = await requireVenueUser("OWNER");
  return (
    <>
      <StaffHeader
        title="Кабинет заведения"
        userName={user.name ?? ""}
        links={[
          { href: "/partner/owner", label: "Заведение" },
          { href: "/partner/owner/hours", label: "Часы работы" },
          { href: "/partner/owner/menu", label: "Меню" },
          { href: "/partner/owner/orders", label: "Заказы" },
          { href: "/partner/kitchen", label: "Кухня" },
        ]}
      />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
