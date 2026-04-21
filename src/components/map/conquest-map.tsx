"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type MapPin = {
  id: string;
  name: string;
  challengeName: string;
  lat: number;
  lng: number;
};

type Props = {
  pins: MapPin[];
  center?: [number, number];
  zoom?: number;
};

export default function ConquestMap({ pins, center = [-14.235, -51.925], zoom = 4 }: Props) {
  useEffect(() => {
    // Fix Leaflet default icon path in Next.js
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
      {pins.map((pin) => (
        <CircleMarker
          key={pin.id}
          center={[pin.lat, pin.lng]}
          radius={8}
          pathOptions={{
            fillColor: "#f97316",
            fillOpacity: 0.85,
            color: "#ea580c",
            weight: 1.5,
          }}
        >
          <Tooltip>
            <span className="font-semibold">{pin.name}</span>
            <br />
            <span className="text-xs text-gray-500">{pin.challengeName}</span>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
