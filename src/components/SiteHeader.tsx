import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="relative z-20 bg-board text-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="whitespace-nowrap font-display text-[15px] font-extrabold tracking-tight lowercase">
          шаверма заранее
        </Link>
        <nav className="ml-auto text-sm">
          <Link href="/connect" className="whitespace-nowrap text-white/75 hover:text-white">
            <span className="sm:hidden">Для шавермных</span>
            <span className="hidden sm:inline">Подключить шавермную</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
