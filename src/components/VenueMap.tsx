"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import Link from "next/link";
import type { VenueCard } from "@/lib/venues";

type Point = { lat: number; lng: number };

function Recenter({ center, zoom }: { center: Point; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
  }, [map, center.lat, center.lng, zoom]);
  return null;
}

export default function VenueMap({
  venues,
  center,
  zoom,
  user,
}: {
  venues: VenueCard[];
  center: Point;
  zoom: number;
  user: Point | null;
}) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} zoom={zoom} />
      {user && (
        <CircleMarker
          center={[user.lat, user.lng]}
          radius={7}
          pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 1 }}
        />
      )}
      {venues.map((v) =>
        v.lat !== null && v.lng !== null ? (
          <CircleMarker
            key={v.slug}
            center={[v.lat, v.lng]}
            radius={10}
            pathOptions={{ color: "#c2410c", fillColor: "#ea580c", fillOpacity: 0.9 }}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{v.name}</div>
                <div>{v.address}</div>
                <Link href={`/v/${v.slug}`} className="font-medium text-orange-600">
                  Открыть меню →
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        ) : null,
      )}
    </MapContainer>
  );
}
