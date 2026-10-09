import Link from "next/link";

export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`sign whitespace-nowrap text-[28px] uppercase ${className}`}>Шаверма заранее</span>;
}

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b-2 border-board bg-kiosk text-board">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" aria-label="На главную">
          <Wordmark />
        </Link>
        <nav className="ml-auto text-sm font-semibold">
          <Link href="/connect" className="whitespace-nowrap underline-offset-4 hover:underline">
            <span className="sm:hidden">Для шавермных</span>
            <span className="hidden sm:inline">Подключить шавермную</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
