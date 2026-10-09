import { randomBytes } from "node:crypto";
import { headers } from "next/headers";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function newInvite() {
  return {
    inviteToken: randomBytes(24).toString("base64url"),
    inviteExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
  };
}

/** Absolute invite URL built from the current request host. */
export async function inviteUrl(token: string): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/invite/${token}`;
}
