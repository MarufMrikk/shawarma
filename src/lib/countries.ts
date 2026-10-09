export type CountryInfo = { code: string; name: string; currency: string; timezone: string };

/** Supported countries with defaults for new venues (admin can override currency/timezone). */
export const COUNTRIES: CountryInfo[] = [
  { code: "RU", name: "Россия", currency: "RUB", timezone: "Europe/Moscow" },
];

export const DEFAULT_CITY = { name: "Москва", lat: 55.7558, lng: 37.6173 };

export const countryByCode = (code: string) => COUNTRIES.find((c) => c.code === code);

export const countryName = (code: string) => countryByCode(code)?.name ?? code;

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function isValidCurrency(code: string): boolean {
  if (!/^[A-Z]{3}$/.test(code)) return false;
  try {
    new Intl.NumberFormat("ru-RU", { style: "currency", currency: code });
    return true;
  } catch {
    return false;
  }
}
