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
  loading: () => <div className="absolute inset-0 animate-pulse bg-[#e8e6ee]" />,
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

      <aside className="relative z-10 -mt-5 flex flex-col rounded-t-3xl bg-white md:mt-0 md:w-[400px] md:rounded-none md:border-l md:border-line">
        <div className="border-b border-line px-5 pb-4 pt-5">
          <h1 className="font-display text-xl font-bold leading-tight">Шаверма рядом с вами</h1>
          <p className="mt-1 text-sm text-muted">Закажите заранее и заберите без очереди.</p>

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
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-board hover:text-chili disabled:opacity-60"
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
                    className={`border-b border-l-4 border-b-line transition-colors ${
                      isSelected ? "border-l-chili bg-page" : "border-l-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3 px-5 py-4">
                      <button type="button" onClick={() => selectFromList(v)} className="min-w-0 flex-1 text-left">
                        <div className="font-semibold">{v.name}</div>
                        <div className="truncate text-sm text-muted">{v.address}</div>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                          {v.distance !== null && <span className="font-medium">{formatDistance(v.distance)}</span>}
                          <span className="text-herb">Открыто {v.hoursLabel}</span>
                          {v.minPrice !== null && (
                            <span className="text-muted">от {formatMoney(v.minPrice, v.currency)}</span>
                          )}
                        </div>
                      </button>
                      <Link href={`/v/${v.slug}`} className="btn-primary shrink-0 px-3.5 py-2 text-sm">
                        Меню
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
