import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-orange-600">
          Шаверма·Предзаказ
        </Link>
        <nav className="ml-auto flex gap-4 text-sm">
          <Link href="/connect" className="text-neutral-700 hover:text-orange-600">
            Подключить заведение
          </Link>
        </nav>
      </div>
    </header>
  );
}
