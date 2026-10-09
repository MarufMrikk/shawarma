import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PartnerHeader } from "@/components/PartnerHeader";

export const metadata = { title: "Кабинет шавермных" };

const STEPS = [
  { title: "Оставьте заявку", text: "Название, адрес и телефон шавермной. Мы перезвоним в течение рабочего дня." },
  { title: "Получите доступ", text: "После проверки пришлём ссылку для входа владельцу." },
  { title: "Заполните меню и часы", text: "Как только меню готово и вы открыты — гости видят вас на карте." },
];

export default async function PartnerHomePage() {
  const session = await auth();
  if (session?.user) {
    if (session.user.role === "ADMIN") redirect("/partner/admin");
    if (session.user.role === "OWNER") redirect("/partner/owner");
    redirect("/partner/kitchen");
  }

  return (
    <>
      <PartnerHeader />
      <main className="flex-1 bg-board text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 lg:grid-cols-[1.2fr_1fr]">
          <section>
            <h1 className="sign text-[64px] text-kiosk sm:text-[88px]">Заказы к вашему окошку — заранее</h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">
              Гости выбирают шаверму на карте, оплачивают при получении и приходят ко времени. Вы видите заказы на
              экране кухни и готовите без очереди у окна.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/partner/connect" className="btn-primary px-6 py-3 text-base">
                Подключить шавермную
              </Link>
              <Link
                href="/partner/login"
                className="inline-flex items-center rounded-lg border-2 border-white/30 px-6 py-3 font-semibold hover:border-white"
              >
                Войти в кабинет
              </Link>
            </div>
          </section>

          <ol className="space-y-6 self-center">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="sign flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-kiosk text-[32px] text-board">
                  {i + 1}
                </span>
                <div>
                  <h2 className="text-lg font-bold">{step.title}</h2>
                  <p className="mt-1 text-white/65">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </>
  );
}
