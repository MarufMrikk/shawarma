"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLink = { href: string; label: string };

export function StaffNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  // The most specific link that prefixes the current path is the active one.
  const active = links
    .filter((l) => pathname === l.href || pathname.startsWith(`${l.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="flex flex-wrap gap-1 text-sm font-semibold">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={l.href === active ? "page" : undefined}
          className={`rounded-md px-2.5 py-1 ${l.href === active ? "bg-kiosk text-board" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
