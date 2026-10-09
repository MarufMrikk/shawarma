import Link from "next/link";
import { Wordmark } from "@/components/SiteHeader";

/** Brand mark of the partner portal — visibly a different product from the customer site. */
export function PartnerMark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-baseline gap-2 ${className}`}>
      <Wordmark className="text-kiosk" />
      <span className="whitespace-nowrap rounded bg-kiosk px-1.5 py-0.5 text-xs font-bold text-board">для бизнеса</span>
    </span>
  );
}

/** Header for public partner pages (landing, connect, invite). */
export function PartnerHeader() {
  return (
    <header className="border-b-2 border-kiosk bg-board text-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/partner" aria-label="Кабинет шавермных">
          <PartnerMark />
        </Link>
        <nav className="ml-auto flex gap-4 text-sm font-semibold">
          <Link href="/partner/login" className="underline-offset-4 hover:underline">
            Войти
          </Link>
        </nav>
      </div>
    </header>
  );
}
