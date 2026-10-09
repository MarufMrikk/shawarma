import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Wordmark } from "@/components/SiteHeader";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Вход для сотрудников" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const { invited } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center bg-kiosk px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" aria-label="На главную">
          <Wordmark className="text-[40px]" />
        </Link>
        <div className="mt-6 rounded-xl border-2 border-board bg-white p-6 shadow-[5px_5px_0_#26211c]">
          <h1 className="sign text-[36px]">Вход для сотрудников</h1>
          <p className="mb-5 mt-2 text-sm text-muted">Для поваров, владельцев шавермных и администраторов сервиса.</p>
          {invited && <p className="mb-4 text-sm font-medium text-herb">Пароль сохранён. Теперь войдите.</p>}
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
