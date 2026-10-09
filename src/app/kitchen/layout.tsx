import { StaffHeader } from "@/components/StaffHeader";
import { requireVenueUser } from "@/lib/session";

export default async function KitchenLayout({ children }: LayoutProps<"/kitchen">) {
  const user = await requireVenueUser("OWNER", "STAFF");
  const links = [{ href: "/kitchen", label: "Заказы" }];
  if (user.role === "OWNER") links.push({ href: "/owner", label: "Кабинет" });
  return (
    <>
      <StaffHeader title="Кухня" userName={user.name ?? ""} links={links} />
      <main className="flex-1 bg-board text-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-6">{children}</div>
      </main>
    </>
  );
}
