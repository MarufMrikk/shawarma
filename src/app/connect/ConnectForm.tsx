"use client";

import { useActionState } from "react";
import type { CountryInfo } from "@/lib/countries";
import { submitLead, type ConnectState } from "./actions";

const initial: ConnectState = { error: null, done: false };

export function ConnectForm({ countries }: { countries: CountryInfo[] }) {
  const [state, action, pending] = useActionState(submitLead, initial);

  if (state.done) {
    return (
      <div className="rounded-2xl bg-white p-6">
        <h2 className="font-display text-lg font-bold text-herb">Заявка отправлена</h2>
        <p className="mt-1 text-sm text-muted">Перезвоним в течение рабочего дня и расскажем, как подключиться.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input name="venueName" placeholder="Название заведения" className="input" required />
      <input type="hidden" name="country" value={countries[0]?.code ?? "RU"} />
      <input name="city" defaultValue="Москва" placeholder="Город" className="input" required />
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
