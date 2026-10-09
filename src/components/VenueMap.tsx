"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { formatMoney } from "@/lib/money";
import type { VenueCard } from "@/lib/venues";

export type Point = { lat: number; lng: number };

/** A camera command; `id` changes whenever the view should be applied again. */
export type MapView = { id: number } & ({ kind: "bounds"; points: Point[] } | { kind: "point"; point: Point; zoom: number });

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function venueIcon(name: string, price: string | null, selected: boolean) {
  const tone = selected ? "bg-chili text-white border-board" : "bg-kiosk text-board border-board";
  const priceTone = selected ? "text-white/85" : "text-chili";
  return L.divIcon({
    className: "pin-icon",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `<div class="absolute bottom-0 left-0 flex -translate-x-1/2 flex-col items-center ${selected ? "z-10" : ""}">
      <div class="${tone} rounded-md border-2 px-2.5 pb-1 pt-1.5 text-center leading-none shadow-[3px_3px_0_#26211c]">
        <div class="whitespace-nowrap text-[13px] font-bold">${escapeHtml(name)}</div>
        ${price ? `<div class="mt-0.5 font-display text-[17px] font-extrabold ${priceTone}">от ${escapeHtml(price)}</div>` : ""}
      </div>
      <div class="h-3 w-0.5 bg-board"></div>
      <div class="h-2 w-2 rounded-full border-2 border-board bg-white"></div>
    </div>`,
  });
}

const userIcon = L.divIcon({
  className: "pin-icon",
  iconSize: [0, 0],
  iconAnchor: [0, 0],
  html: `<div class="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full border-[3px] border-white bg-[#2563eb] shadow-[0_0_0_6px_rgba(37,99,235,.2)]"></div>`,
});

function Camera({ view }: { view: MapView }) {
  const map = useMap();
  useEffect(() => {
    if (view.kind === "point") {
      map.flyTo([view.point.lat, view.point.lng], view.zoom, { duration: 0.6 });
    } else if (view.points.length === 1) {
      map.setView([view.points[0].lat, view.points[0].lng], 14);
    } else if (view.points.length > 1) {
      map.fitBounds(L.latLngBounds(view.points.map((p) => [p.lat, p.lng])), { padding: [60, 60], maxZoom: 15 });
    }
    // Only re-run when a new view is requested.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, view.id]);
  return null;
}

export default function VenueMap({
  venues,
  selected,
  onSelect,
  user,
  view,
}: {
  venues: VenueCard[];
  selected: string | null;
  onSelect: (slug: string) => void;
  user: Point | null;
  view: MapView;
}) {
  const icons = useMemo(
    () =>
      new Map(
        venues.map((v) => {
          const price = v.minPrice !== null ? formatMoney(v.minPrice, v.currency) : null;
          return [v.slug, { normal: venueIcon(v.name, price, false), active: venueIcon(v.name, price, true) }];
        }),
      ),
    [venues],
  );

  return (
    <MapContainer
      center={[55.7558, 37.6173]}
      zoom={12}
      zoomControl={false}
      className="absolute inset-0 z-0 bg-[#ecebe7]"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ZoomControl position="bottomright" />
      <Camera view={view} />
      {user && <Marker position={[user.lat, user.lng]} icon={userIcon} interactive={false} />}
      {venues.map((v) => {
        if (v.lat === null || v.lng === null) return null;
        const isSelected = v.slug === selected;
        const icon = icons.get(v.slug)!;
        return (
          <Marker
            key={v.slug}
            position={[v.lat, v.lng]}
            icon={isSelected ? icon.active : icon.normal}
            zIndexOffset={isSelected ? 1000 : 0}
            title={v.name}
            keyboard
            eventHandlers={{ click: () => onSelect(v.slug) }}
          />
        );
      })}
    </MapContainer>
  );
}
