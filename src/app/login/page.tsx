import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Вход для сотрудников" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const { invited } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">Вход для сотрудников</h1>
      {invited && <p className="mb-4 text-sm text-green-700">Пароль сохранён — войдите.</p>}
      <LoginForm />
    </main>
  );
}
