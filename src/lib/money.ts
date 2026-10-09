const fractionDigitsCache = new Map<string, number>();

export function currencyDigits(currency: string): number {
  let digits = fractionDigitsCache.get(currency);
  if (digits === undefined) {
    digits = new Intl.NumberFormat("ru-RU", { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
    fractionDigitsCache.set(currency, digits);
  }
  return digits;
}

/** Formats an integer amount in minor units, e.g. 35000 RUB -> "350 ₽". */
export function formatMoney(minor: number, currency: string): string {
  const digits = currencyDigits(currency);
  const major = minor / 10 ** digits;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(major) ? 0 : digits,
    maximumFractionDigits: digits,
  }).format(major);
}

/** Parses a user-entered major-unit string ("350", "350,50") into minor units. */
export function parseMoney(input: string, currency: string): number | null {
  const normalized = input.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 10 ** currencyDigits(currency));
}

/** Minor units -> plain major-unit string for form inputs, e.g. 35050 -> "350.5". */
export function toMajorString(minor: number, currency: string): string {
  return String(minor / 10 ** currencyDigits(currency));
}
