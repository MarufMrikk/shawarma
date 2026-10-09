"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(loginAction, null);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input name="email" type="email" required placeholder="Email" className="input" autoComplete="email" />
      <input
        name="password"
        type="password"
        required
        placeholder="Пароль"
        className="input"
        autoComplete="current-password"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={pending} className="btn-primary">
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}
