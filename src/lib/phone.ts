/** Normalizes a phone to E.164. Returns null if it can't be made valid. */
export function toE164(input: string): string | null {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = "+" + digits.slice(2);
  // Russian/Kazakh local format 8XXXXXXXXXX -> +7XXXXXXXXXX
  if (/^8\d{10}$/.test(digits)) digits = "+7" + digits.slice(1);
  if (!digits.startsWith("+")) digits = "+" + digits;
  return /^\+[1-9]\d{7,14}$/.test(digits) ? digits : null;
}
