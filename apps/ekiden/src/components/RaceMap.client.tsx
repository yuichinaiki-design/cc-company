"use client";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Positions } from "@/hooks/useSightings";

const DEFAULT_CENTER: [number, number] = [35.681236, 139.767125]; // 東京駅
const DEFAULT_ZOOM = 14;

function bibIcon(bib: number, staleness: number) {
  const opacity = Math.max(0.35, 1 - staleness);
  return L.divIcon({
    className: "bib-pin-wrap",
    html: `<div class="bib-pin" style="opacity:${opacity}">${bib}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function FitBounds({ positions }: { positions: Positions }) {
  const map = useMap();
  const fittedRef = useRef(false);
  useEffect(() => {
    const pts = Object.values(positions);
    if (pts.length === 0 || fittedRef.current) return;
    const bounds = L.latLngBounds(pts.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds.pad(0.3), { maxZoom: 16 });
    fittedRef.current = true;
  }, [positions, map]);
  return null;
}

export default function RaceMapClient({ positions }: { positions: Positions }) {
  const entries = useMemo(() => Object.entries(positions), [positions]);
  const now = Date.now();

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds positions={positions} />
      {entries.map(([bib, p]) => {
        const ageSec = (now - p.updatedAt) / 1000;
        const stale = Math.min(1, ageSec / 120);
        return (
          <Marker
            key={bib}
            position={[p.lat, p.lng]}
            icon={bibIcon(Number(bib), stale)}
          />
        );
      })}
    </MapContainer>
  );
}
