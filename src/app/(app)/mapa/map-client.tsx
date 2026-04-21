"use client";

import dynamic from "next/dynamic";
import type { MapPin } from "@/components/map/conquest-map";

const ConquestMap = dynamic(() => import("@/components/map/conquest-map"), {
  ssr: false,
});

export default function MapClient({ pins }: { pins: MapPin[] }) {
  return (
    <div className="w-full h-full relative">
      <ConquestMap pins={pins} />
    </div>
  );
}
