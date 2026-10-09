import { StaffHeader } from "@/components/StaffHeader";
import { requireVenueUser } from "@/lib/session";

export default async function OwnerLayout({ children }: LayoutProps<"/owner">) {
  const user = await requireVenueUser("OWNER");
  return (
    <>
      <StaffHeader
        title="Кабинет заведения"
        userName={user.name ?? ""}
        links={[
          { href: "/owner", label: "Заведение" },
          { href: "/owner/hours", label: "Часы работы" },
          { href: "/owner/menu", label: "Меню" },
          { href: "/owner/orders", label: "Заказы" },
          { href: "/kitchen", label: "Кухня" },
        ]}
      />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
