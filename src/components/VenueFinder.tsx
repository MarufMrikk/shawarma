"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { distanceKm } from "@/lib/geo";
import { formatMoney } from "@/lib/money";
import type { VenueCard } from "@/lib/venues";
import type { MapView, Point } from "./VenueMap";

const VenueMap = dynamic(() => import("./VenueMap"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-[#ecebe7]" />,
});

type GeoState = "idle" | "locating" | "denied";

const CITY = "Москва";

export function VenueFinder({ venues }: { venues: VenueCard[] }) {
  const [user, setUser] = useState<Point | null>(null);
  const [geo, setGeo] = useState<GeoState>("idle");
  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<MapView>(() => ({
    id: 0,
    kind: "bounds",
    points: venues.flatMap((v) => (v.lat !== null && v.lng !== null ? [{ lat: v.lat, lng: v.lng }] : [])),
  }));
  const rowRefs = useRef(new Map<string, HTMLLIElement>());

  const sorted = useMemo(() => {
    const withDistance = venues.map((v) => ({
      ...v,
      distance: user && v.lat !== null && v.lng !== null ? distanceKm(user, { lat: v.lat, lng: v.lng }) : null,
    }));
    return withDistance.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [venues, user]);

  const showAround = useCallback(
    (point: Point) => {
      setUser(point);
      const nearest = venues
        .flatMap((v) => (v.lat !== null && v.lng !== null ? [{ lat: v.lat, lng: v.lng }] : []))
        .sort((a, b) => distanceKm(point, a) - distanceKm(point, b))
        .slice(0, 3);
      setView((prev) => ({ id: prev.id + 1, kind: "bounds", points: [point, ...nearest] }));
    },
    [venues],
  );

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeo("denied");
      return;
    }
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo("idle");
        showAround({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setGeo("denied"),
      { timeout: 10000, maximumAge: 300000 },
    );
  }, [showAround]);

  useEffect(() => {
    locate();
  }, [locate]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/geocode?country=RU&q=${encodeURIComponent(`${CITY}, ${q}`)}`);
      if (!res.ok) throw new Error();
      showAround((await res.json()) as Point);
    } catch {
      setSearchError("Не нашли такой адрес в Москве. Попробуйте улицу с номером дома или станцию метро.");
    } finally {
      setSearching(false);
    }
  }

  function selectFromMap(slug: string) {
    setSelected(slug);
    rowRefs.current.get(slug)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function selectFromList(v: VenueCard) {
    setSelected(v.slug);
    if (v.lat !== null && v.lng !== null) {
      setView((prev) => ({ id: prev.id + 1, kind: "point", point: { lat: v.lat!, lng: v.lng! }, zoom: 15 }));
    }
  }

  return (
    <div className="flex flex-1 flex-col md:h-[calc(100vh-3.5rem)] md:flex-row">
      <div className="relative h-[52vh] md:h-auto md:flex-1">
        <VenueMap venues={venues} selected={selected} onSelect={selectFromMap} user={user} view={view} />
      </div>

      <aside className="relative z-10 -mt-4 flex flex-col rounded-t-2xl border-t-2 border-board bg-white md:mt-0 md:w-[420px] md:rounded-none md:border-l-2 md:border-t-0">
        <div className="border-b-2 border-board px-5 pb-4 pt-5">
          <h1 className="sign text-[44px]">Шаверма рядом</h1>
          <p className="mt-2 text-[15px] text-muted">Закажите заранее — к вашему приходу всё будет готово.</p>

          <form onSubmit={search} className="mt-4 flex gap-2">
            <label className="sr-only" htmlFor="address">
              Адрес или метро
            </label>
            <input
              id="address"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Адрес или метро"
              className="input"
              autoComplete="street-address"
            />
            <button className="btn-secondary shrink-0" disabled={searching}>
              {searching ? "Ищем…" : "Найти"}
            </button>
          </form>
          <button
            type="button"
            onClick={locate}
            disabled={geo === "locating"}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-board underline-offset-4 hover:underline disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="3.5" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
            {geo === "locating" ? "Определяем местоположение…" : "Показать шавермы рядом со мной"}
          </button>
          {geo === "denied" && !user && (
            <p className="mt-2 text-sm text-muted">Доступ к геолокации закрыт — введите адрес.</p>
          )}
          {searchError && <p className="mt-2 text-sm text-chili">{searchError}</p>}
        </div>

        <div className="flex-1 overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="px-5 py-8">
              <p className="font-medium">Сейчас все шавермные закрыты.</p>
              <p className="mt-1 text-sm text-muted">Загляните позже — большинство открывается к 10:00.</p>
            </div>
          ) : (
            <ul>
              {sorted.map((v) => {
                const isSelected = v.slug === selected;
                return (
                  <li
                    key={v.slug}
                    ref={(el) => {
                      if (el) rowRefs.current.set(v.slug, el);
                      else rowRefs.current.delete(v.slug);
                    }}
                    className={`border-b border-line transition-colors ${isSelected ? "bg-kiosk/35" : ""}`}
                  >
                    <div className="flex items-center gap-4 px-5 py-4">
                      <button type="button" onClick={() => selectFromList(v)} className="min-w-0 flex-1 text-left">
                        <div className="text-[17px] font-bold leading-snug">{v.name}</div>
                        <div className="truncate text-sm text-muted">{v.address}</div>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                          {v.distance !== null && <span className="font-semibold">{formatDistance(v.distance)}</span>}
                          <span className="font-medium text-herb">Открыто {v.hoursLabel}</span>
                        </div>
                      </button>
                      <Link href={`/v/${v.slug}`} className="group shrink-0 text-right">
                        {v.minPrice !== null && (
                          <span className="block text-xs text-muted">шаверма от</span>
                        )}
                        {v.minPrice !== null && (
                          <span className="price block text-[30px]">{formatMoney(v.minPrice, v.currency)}</span>
                        )}
                        <span className="mt-1 inline-block text-sm font-semibold underline-offset-4 group-hover:underline">
                          Открыть меню
                        </span>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 100) * 10} м` : `${km < 10 ? km.toFixed(1).replace(".", ",") : Math.round(km)} км`;
}
