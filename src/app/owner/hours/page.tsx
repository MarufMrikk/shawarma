import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { db } from "@/lib/db";
import { minutesToHHMM, WEEKDAY_LABELS } from "@/lib/hours";
import { requireVenueUser } from "@/lib/session";
import { saveHours } from "../actions";

export const metadata = { title: "Часы работы" };

export default async function HoursPage() {
  const user = await requireVenueUser("OWNER");
  const venue = await db.venue.findUniqueOrThrow({
    where: { id: user.venueId },
    select: { timezone: true, hours: true },
  });
  const byDay = new Map(venue.hours.map((h) => [h.weekday, h]));

  return (
    <section className="max-w-lg">
      <h1 className="mb-1 text-xl font-bold">Часы работы</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Время местное ({venue.timezone}). Если закрытие раньше открытия — работаете после полуночи; 00:00–00:00 —
        круглосуточно.
      </p>
      <ActionForm action={saveHours} className="space-y-2">
        {WEEKDAY_LABELS.map((label, d) => {
          const h = byDay.get(d);
          return (
            <div key={d} className="flex items-center gap-3">
              <label className="flex w-20 items-center gap-2">
                <input type="checkbox" name={`open_${d}`} defaultChecked={!!h} />
                {label}
              </label>
              <input
                type="time"
                name={`from_${d}`}
                defaultValue={minutesToHHMM(h?.opensAt ?? 600)}
                className="input w-32"
              />
              <span>—</span>
              <input
                type="time"
                name={`to_${d}`}
                defaultValue={minutesToHHMM((h?.closesAt ?? 1320) % 1440)}
                className="input w-32"
              />
            </div>
          );
        })}
        <div className="pt-2">
          <SubmitButton>Сохранить</SubmitButton>
        </div>
      </ActionForm>
    </section>
  );
}
