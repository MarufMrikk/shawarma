import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { db } from "@/lib/db";
import { countryByCode, countryName } from "@/lib/countries";
import { LEAD_STATUS_LABELS, LEAD_STATUSES } from "@/lib/leads";
import { requireRole } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { addLeadNote, approveLead, updateLead } from "../../actions";

export const metadata = { title: "Заявка" };

const dateTimeFmt = new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" });

export default async function LeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  await requireRole("ADMIN");
  const { id } = await params;
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      venue: { select: { id: true, name: true } },
    },
  });
  if (!lead) notFound();
  const defaults = countryByCode(lead.country);

  return (
    <div className="space-y-6">
      <Link href="/admin/leads" className="text-sm text-neutral-600 hover:text-orange-600">
        ← Заявки
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-neutral-200 bg-white p-4">
          <h1 className="text-xl font-bold">{lead.venueName}</h1>
          <dl className="mt-3 grid grid-cols-[140px_1fr] gap-1 text-sm">
            <dt className="text-neutral-500">Страна</dt>
            <dd>{countryName(lead.country)}</dd>
            <dt className="text-neutral-500">Адрес</dt>
            <dd>
              {lead.city}, {lead.address}
            </dd>
            <dt className="text-neutral-500">Контакт</dt>
            <dd>{lead.contactName}</dd>
            <dt className="text-neutral-500">Телефон</dt>
            <dd>
              <a href={`tel:${lead.phone}`}>{lead.phone}</a>
            </dd>
            <dt className="text-neutral-500">Email</dt>
            <dd>{lead.email ?? "—"}</dd>
            <dt className="text-neutral-500">Создана</dt>
            <dd>{dateTimeFmt.format(lead.createdAt)}</dd>
          </dl>

          <ActionForm action={updateLead} className="mt-4 flex flex-wrap items-end gap-2 border-t border-neutral-100 pt-4">
            <input type="hidden" name="id" value={lead.id} />
            <label className="text-sm">
              Статус
              <select name="status" defaultValue={lead.status} className="input mt-1">
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {LEAD_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Следующий контакт
              <input
                type="date"
                name="nextContactAt"
                defaultValue={lead.nextContactAt?.toISOString().slice(0, 10) ?? ""}
                className="input mt-1"
              />
            </label>
            <SubmitButton className="btn-secondary">Сохранить</SubmitButton>
          </ActionForm>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-4">
          {lead.venue ? (
            <>
              <h2 className="font-semibold">Подключено</h2>
              <Link href={`/admin/venues/${lead.venue.id}`} className="text-orange-600 underline">
                {lead.venue.name} →
              </Link>
            </>
          ) : (
            <>
              <h2 className="mb-3 font-semibold">Одобрить и создать заведение</h2>
              <ActionForm action={approveLead} className="space-y-2 text-sm">
                <input type="hidden" name="leadId" value={lead.id} />
                <label className="block">
                  Название
                  <input name="name" defaultValue={lead.venueName} className="input mt-1" required />
                </label>
                <label className="block">
                  Адрес страницы (/v/…)
                  <input
                    name="slug"
                    defaultValue={slugify(`${lead.venueName}-${lead.city}`)}
                    className="input mt-1"
                    required
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    Валюта
                    <input name="currency" defaultValue={defaults?.currency ?? ""} className="input mt-1" required />
                  </label>
                  <label className="block">
                    Комиссия, %
                    <input name="commission" defaultValue="10" className="input mt-1" inputMode="decimal" required />
                  </label>
                </div>
                <label className="block">
                  Часовой пояс
                  <input name="timezone" defaultValue={defaults?.timezone ?? ""} className="input mt-1" required />
                </label>
                <label className="block">
                  Email владельца
                  <input name="ownerEmail" type="email" defaultValue={lead.email ?? ""} className="input mt-1" required />
                </label>
                <label className="block">
                  Имя владельца
                  <input name="ownerName" defaultValue={lead.contactName} className="input mt-1" />
                </label>
                <SubmitButton>Одобрить</SubmitButton>
              </ActionForm>
            </>
          )}
        </section>
      </div>

      <section className="max-w-2xl">
        <h2 className="mb-2 font-semibold">Заметки</h2>
        <ActionForm action={addLeadNote} className="mb-4 space-y-2">
          <input type="hidden" name="leadId" value={lead.id} />
          <textarea name="text" rows={3} className="input" placeholder="Итог звонка, договорённости…" required />
          <SubmitButton className="btn-secondary">Добавить заметку</SubmitButton>
        </ActionForm>
        <ul className="space-y-2">
          {lead.notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
              <div className="mb-1 text-xs text-neutral-500">
                {dateTimeFmt.format(n.createdAt)} · {n.author?.name ?? "—"}
              </div>
              <div className="whitespace-pre-wrap">{n.text}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
