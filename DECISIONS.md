# Decisions

- Next 16 `cacheComponents` disabled; root layout is `force-dynamic` (all pages read live DB data).
- Prisma 7 with `prisma-client` generator (output `src/generated/prisma`) and `@prisma/adapter-pg`.
- Auth.js v5 credentials (email + password), JWT sessions, no DB adapter; email-link login skipped (needs SMTP). Invites = one-time link to set a password.
- Route protection via `requireRole()` in server layouts, no proxy/middleware.
- Opening hours: per weekday (0 = Monday), minutes from local midnight; `closesAt <= opensAt` = past midnight; 0–1440 = 24h.
- Add-ons modeled as per-item modifier groups (min/max select) with options and price deltas.
- Commission stored as `Decimal(5,2)` percent.
- `paymentStatus` is a plain string, default `unpaid`.
- Seed venues: Moscow (RUB), Almaty (KZT), Tashkent (UZS); all seeded users share `SEED_PASSWORD`.
- Money formatted via `Intl.NumberFormat` with the currency's own fraction digits.
- Leaflet markers are `CircleMarker`s (no image assets); map loaded client-only via `next/dynamic`.
- Nominatim is called through `/api/geocode` (server-side, with User-Agent) — used for the manual city fallback.
- Cart and customer name/phone are kept in `localStorage`; server recomputes all prices from DB on placement.
- Closed venues still show their menu page, but ordering is disabled; unapproved venues return 404.
- Order page polls via `router.refresh()` every 8 s until picked up/cancelled; order link = unguessable cuid.
- Customer-facing note "оплата при получении" (no payment step in this version).
