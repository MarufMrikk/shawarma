import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { Wordmark } from "@/components/SiteHeader";
import { StaffNav, type NavLink } from "./StaffNav";

export function StaffHeader({ title, links, userName }: { title: string; links: NavLink[]; userName: string }) {
  return (
    <header className="border-b-2 border-board bg-kiosk text-board">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
        <Link href="/dashboard" className="flex items-baseline gap-2">
          <Wordmark className="text-[24px]" />
          <span className="text-sm font-semibold">{title}</span>
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
