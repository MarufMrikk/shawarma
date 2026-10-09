import Link from "next/link";
import { logoutAction } from "@/app/partner/login/actions";
import { PartnerMark } from "@/components/PartnerHeader";
import { StaffNav, type NavLink } from "./StaffNav";

export function StaffHeader({ title, links, userName }: { title: string; links: NavLink[]; userName: string }) {
  return (
    <header className="border-b-2 border-kiosk bg-board text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
        <Link href="/partner" className="flex items-baseline gap-2">
          <PartnerMark />
          <span className="text-sm font-semibold text-white/70">{title}</span>
        </Link>
        <StaffNav links={links} />
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="font-medium">{userName}</span>
          <form action={logoutAction}>
            <button className="font-semibold underline underline-offset-4">Выйти</button>
          </form>
        </div>
      </div>
    </header>
  );
}
