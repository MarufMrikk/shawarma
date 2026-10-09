export type HoursInterval = { weekday: number; opensAt: number; closesAt: number };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

/** Weekday (0 = Monday) and minutes since local midnight in the given timezone. */
export function localTime(timezone: string, now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    weekday: WEEKDAYS.indexOf(get("weekday")),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

const overnight = (h: HoursInterval) => h.closesAt <= h.opensAt;

export function isOpenAt(hours: HoursInterval[], timezone: string, now: Date = new Date()): boolean {
  const { weekday, minutes } = localTime(timezone, now);
  const yesterday = (weekday + 6) % 7;
  return hours.some((h) => {
    if (h.weekday === weekday) {
      return overnight(h) ? minutes >= h.opensAt : minutes >= h.opensAt && minutes < h.closesAt;
    }
    return h.weekday === yesterday && overnight(h) && minutes < h.closesAt;
  });
}

export function minutesToHHMM(m: number): string {
  if (m >= 1440) return "24:00";
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function hhmmToMinutes(s: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!match) return null;
  const m = Number(match[1]) * 60 + Number(match[2]);
  return m <= 1440 && Number(match[2]) < 60 ? m : null;
}

export function formatInterval(h: Pick<HoursInterval, "opensAt" | "closesAt">): string {
  if ((h.opensAt === 0 && h.closesAt >= 1440) || h.opensAt === h.closesAt) return "круглосуточно";
  return `${minutesToHHMM(h.opensAt)}–${minutesToHHMM(h.closesAt)}`;
}

export function todayHoursLabel(hours: HoursInterval[], timezone: string, now: Date = new Date()): string {
  const { weekday } = localTime(timezone, now);
  const today = hours.filter((h) => h.weekday === weekday);
  return today.length ? today.map(formatInterval).join(", ") : "сегодня выходной";
}

/** "до 02:00" / "круглосуточно" for a venue that is open now; null if closed. */
export function openUntilLabel(hours: HoursInterval[], timezone: string, now: Date = new Date()): string | null {
  const { weekday, minutes } = localTime(timezone, now);
  const yesterday = (weekday + 6) % 7;
  const current = hours.find((h) =>
    h.weekday === weekday
      ? overnight(h)
        ? minutes >= h.opensAt
        : minutes >= h.opensAt && minutes < h.closesAt
      : h.weekday === yesterday && overnight(h) && minutes < h.closesAt,
  );
  if (!current) return null;
  if ((current.opensAt === 0 && current.closesAt >= 1440) || current.opensAt === current.closesAt) return "круглосуточно";
  return current.closesAt % 1440 === 0 ? "до полуночи" : `до ${minutesToHHMM(current.closesAt % 1440)}`;
}
