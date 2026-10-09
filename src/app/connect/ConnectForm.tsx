"use client";

import { useActionState } from "react";
import type { CountryInfo } from "@/lib/countries";
import { submitLead, type ConnectState } from "./actions";

const initial: ConnectState = { error: null, done: false };

export function ConnectForm({ countries }: { countries: CountryInfo[] }) {
  const [state, action, pending] = useActionState(submitLead, initial);

  if (state.done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <h2 className="font-semibold text-green-800">Заявка отправлена</h2>
        <p className="mt-1 text-sm text-green-800">Мы свяжемся с вами в ближайшее время.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input name="venueName" placeholder="Название заведения" className="input" required />
      <select name="country" className="input" required defaultValue="">
        <option value="" disabled>
          Страна
        </option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
      <input name="city" placeholder="Город" className="input" required />
      <input name="address" placeholder="Адрес" className="input" required />
      <input name="contactName" placeholder="Контактное лицо" className="input" required />
      <input name="phone" type="tel" placeholder="Телефон" className="input" required />
      <input name="email" type="email" placeholder="Email (необязательно)" className="input" />
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Отправляем…" : "Отправить заявку"}
      </button>
    </form>
  );
}
