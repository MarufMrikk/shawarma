import Link from "next/link";
import { IS_DEMO } from "@/lib/demo";

export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`sign whitespace-nowrap text-[28px] uppercase ${className}`}>Шаверма заранее</span>;
}

export function SiteHeader() {
  return (
    <>
      {IS_DEMO && (
        <div className="bg-board px-4 py-1.5 text-center text-xs font-medium text-white">
          Демо-версия: заказы не отправляются в шавермные и хранятся только в вашем браузере.
        </div>
      )}
    <header className="relative z-20 border-b-2 border-board bg-kiosk text-board">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" aria-label="На главную">
          <Wordmark />
        </Link>
      </div>
    </header>
    </>
  );
}
