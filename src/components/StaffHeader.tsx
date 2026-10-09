import Link from "next/link";
import { logoutAction } from "@/app/login/actions";

type NavLink = { href: string; label: string };

export function StaffHeader({ title, links, userName }: { title: string; links: NavLink[]; userName: string }) {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <span className="font-bold">{title}</span>
        <nav className="flex flex-wrap gap-3 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-neutral-700 hover:text-orange-600">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm text-neutral-500">
          <span>{userName}</span>
          <form action={logoutAction}>
            <button className="underline hover:text-neutral-900">Выйти</button>
          </form>
        </div>
      </div>
    </header>
  );
}
