import Link from "next/link";
import { db } from "@/lib/db";
import { countryName } from "@/lib/countries";
import { LEAD_STATUS_LABELS, LEAD_STATUSES } from "@/lib/leads";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Заявки" };

const dateFmt = new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC", dateStyle: "short" });

export default async function LeadsPage() {
  await requireRole("ADMIN");
  const leads = await db.lead.findMany({
    orderBy: [{ nextContactAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    include: { _count: { select: { notes: true } } },
  });
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Заявки</h1>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {LEAD_STATUSES.map((status) => {
          const column = leads.filter((l) => l.status === status);
          return (
            <section key={status} className="w-64 shrink-0 rounded-xl bg-neutral-100 p-3">
              <h2 className="mb-2 text-sm font-semibold">
                {LEAD_STATUS_LABELS[status]} <span className="text-neutral-500">{column.length}</span>
              </h2>
              <div className="space-y-2">
                {column.map((l) => {
                  const overdue = l.nextContactAt && l.nextContactAt <= today;
                  return (
                    <Link
                      key={l.id}
                      href={`/admin/leads/${l.id}`}
                      className="block rounded-lg bg-white p-3 text-sm shadow-sm hover:ring-2 hover:ring-orange-300"
                    >
                      <div className="font-medium">{l.venueName}</div>
                      <div className="text-neutral-600">
                        {l.city}, {countryName(l.country)}
                      </div>
                      <div className="text-neutral-500">{l.contactName}</div>
                      {l.nextContactAt && (
                        <div className={`mt-1 text-xs ${overdue ? "font-semibold text-red-600" : "text-neutral-500"}`}>
                          Связаться: {dateFmt.format(l.nextContactAt)}
                        </div>
                      )}
                      {l._count.notes > 0 && <div className="text-xs text-neutral-400">заметок: {l._count.notes}</div>}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
