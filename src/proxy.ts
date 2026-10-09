import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps the customer site and the partner portal apart.
 * With PARTNER_HOST set (e.g. business.example.ru), /partner is served only on that host
 * and the partner host serves nothing but /partner. Without it (local dev) both share a host.
 */
export function proxy(request: NextRequest) {
  const partnerHost = process.env.PARTNER_HOST;
  const host = request.headers.get("host") ?? "";
  const isPartnerPath = request.nextUrl.pathname === "/partner" || request.nextUrl.pathname.startsWith("/partner/");

  if (partnerHost) {
    const onPartnerHost = host === partnerHost;
    if (isPartnerPath && !onPartnerHost) return new NextResponse(null, { status: 404 });
    if (!isPartnerPath && onPartnerHost) return NextResponse.redirect(new URL("/partner", request.url));
  }

  const response = NextResponse.next();
  if (isPartnerPath) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  // Static assets are shared by both surfaces.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
