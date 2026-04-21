"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type MapPin = {
  id: string;
  name: string;
  challengeName: string;
  lat: number;
  lng: number;
  status: "approved" | "pending" | "none";
};

type Props = {
  pins: MapPin[];
  center?: [number, number];
  zoom?: number;
};

function FitBounds({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");
    const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
  }, [map, pins]);
  return null;
}

export default function ConquestMap({ pins, center = [-14.235, -51.925], zoom = 4 }: Props) {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full rounded-xl"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds pins={pins} />
      {pins.map((pin) => {
        const fillColor =
          pin.status === "approved" ? "#16a34a" :
          pin.status === "pending" ? "#f97316" :
          "#6b7280";
        const strokeColor =
          pin.status === "approved" ? "#14532d" :
          pin.status === "pending" ? "#7c2d12" :
          "#374151";
        const radius = pin.status === "none" ? 6 : 9;
        const fillOpacity = pin.status === "none" ? 0.5 : 0.9;

        return (
          <CircleMarker
            key={pin.id}
            center={[pin.lat, pin.lng]}
            radius={radius}
            pathOptions={{ fillColor, fillOpacity, color: strokeColor, weight: 1.5 }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <span className="font-semibold">{pin.name}</span>
              <br />
              <span className="text-xs text-gray-500">{pin.challengeName}</span>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
