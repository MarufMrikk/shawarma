/** Absolute link to a customer-site page; relative when both surfaces share a host (local dev). */
export function customerUrl(path: string): string {
  return `${process.env.SITE_URL?.replace(/\/$/, "") ?? ""}${path}`;
}
