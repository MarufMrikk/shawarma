"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { distanceKm } from "@/lib/geo";
import type { VenueCard } from "@/lib/venues";

const VenueMap = dynamic(() => import("./VenueMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-neutral-200" />,
});

type Point = { lat: number; lng: number };
type GeoState = "pending" | "granted" | "denied";

const DEFAULT_CENTER: Point = { lat: 48, lng: 60 };

export function VenueFinder({ venues }: { venues: VenueCard[] }) {
  const [user, setUser] = useState<Point | null>(null);
  const [geo, setGeo] = useState<GeoState>("pending");
  const [city, setCity] = useState("");
  const [cityError, setCityError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeo("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUser({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeo("granted");
      },
      () => setGeo("denied"),
      { timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  async function searchCity(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) return;
    setSearching(true);
    setCityError(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(city.trim())}`);
      if (!res.ok) throw new Error();
      const point = (await res.json()) as Point;
      setUser({ lat: point.lat, lng: point.lng });
    } catch {
      setCityError("Город не найден");
    } finally {
      setSearching(false);
    }
  }

  const sorted = useMemo(() => {
    const withDistance = venues.map((v) => ({
      ...v,
      distance: user && v.lat !== null && v.lng !== null ? distanceKm(user, { lat: v.lat, lng: v.lng }) : null,
    }));
    return withDistance.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [venues, user]);

  const nearest = sorted[0];
  const center =
    user ?? (nearest?.lat != null && nearest.lng != null ? { lat: nearest.lat, lng: nearest.lng } : DEFAULT_CENTER);
  const zoom = user ? 12 : venues.length ? 4 : 3;

  return (
    <div className="flex flex-1 flex-col md:h-[calc(100vh-57px)] md:flex-row">
      <div className="h-[45vh] md:h-full md:flex-1">
        <VenueMap venues={venues} center={center} zoom={zoom} user={user} />
      </div>
      <aside className="w-full overflow-y-auto border-l border-neutral-200 bg-white p-4 md:max-w-sm">
        {geo !== "granted" && (
          <form onSubmit={searchCity} className="mb-4 flex gap-2">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={geo === "pending" ? "Определяем местоположение…" : "Ваш город"}
              className="input"
            />
            <button className="btn-secondary" disabled={searching}>
              Найти
            </button>
          </form>
        )}
        {cityError && <p className="mb-3 text-sm text-red-600">{cityError}</p>}

        <h2 className="mb-3 font-semibold">{user ? "Ближайшие шавермы" : "Открытые шавермы"}</h2>
        {sorted.length === 0 && <p className="text-neutral-500">Сейчас нет открытых заведений.</p>}
        <ul className="space-y-2">
          {sorted.map((v) => (
            <li key={v.slug}>
              <Link
                href={`/v/${v.slug}`}
                className="block rounded-lg border border-neutral-200 p-3 hover:border-orange-400"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{v.name}</span>
                  {v.distance !== null && (
                    <span className="shrink-0 text-sm text-neutral-500">{formatDistance(v.distance)}</span>
                  )}
                </div>
                <div className="text-sm text-neutral-600">
                  {v.city}, {v.address}
                </div>
                <div className="text-xs text-neutral-500">{v.hoursLabel}</div>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} м` : `${km < 10 ? km.toFixed(1) : Math.round(km)} км`;
}
