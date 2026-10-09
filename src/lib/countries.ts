export type CountryInfo = { code: string; name: string; currency: string; timezone: string };

/** Supported countries with defaults for new venues (admin can override currency/timezone). */
export const COUNTRIES: CountryInfo[] = [
  { code: "RU", name: "Россия", currency: "RUB", timezone: "Europe/Moscow" },
  { code: "KZ", name: "Казахстан", currency: "KZT", timezone: "Asia/Almaty" },
  { code: "UZ", name: "Узбекистан", currency: "UZS", timezone: "Asia/Tashkent" },
  { code: "BY", name: "Беларусь", currency: "BYN", timezone: "Europe/Minsk" },
  { code: "KG", name: "Кыргызстан", currency: "KGS", timezone: "Asia/Bishkek" },
  { code: "TJ", name: "Таджикистан", currency: "TJS", timezone: "Asia/Dushanbe" },
  { code: "AM", name: "Армения", currency: "AMD", timezone: "Asia/Yerevan" },
  { code: "AZ", name: "Азербайджан", currency: "AZN", timezone: "Asia/Baku" },
  { code: "MD", name: "Молдова", currency: "MDL", timezone: "Europe/Chisinau" },
];

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
