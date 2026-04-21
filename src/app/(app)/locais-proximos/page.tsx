"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Navigation, RefreshCw, ChevronLeft } from "lucide-react";
import { findNearbyTargets, type NearbyPin } from "@/app/actions/targets";
import type { MapPin } from "@/components/map/conquest-map";

const ConquestMap = dynamic(() => import("@/components/map/conquest-map"), { ssr: false });

const RADII = [
  { label: "25 km", value: 25 },
  { label: "50 km", value: 50 },
  { label: "100 km", value: 100 },
  { label: "200 km", value: 200 },
];

type State =
  | { phase: "idle" }
  | { phase: "locating" }
  | { phase: "fetching"; coords: GeolocationCoordinates }
  | { phase: "done"; pins: NearbyPin[]; coords: GeolocationCoordinates }
  | { phase: "error"; message: string };

export default function LocaisProximosPage() {
  const [radius, setRadius] = useState(50);
  const [state, setState] = useState<State>({ phase: "idle" });

  const search = useCallback(
    (coords?: GeolocationCoordinates) => {
      if (coords) {
        setState({ phase: "fetching", coords });
        findNearbyTargets(coords.latitude, coords.longitude, radius).then((pins) => {
          setState({ phase: "done", pins, coords });
        });
        return;
      }

      setState({ phase: "locating" });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setState({ phase: "fetching", coords: pos.coords });
          findNearbyTargets(pos.coords.latitude, pos.coords.longitude, radius).then((pins) => {
            setState({ phase: "done", pins, coords: pos.coords });
          });
        },
        (err) => {
          setState({
            phase: "error",
            message:
              err.code === err.PERMISSION_DENIED
                ? "Permissão de localização negada. Habilite nas configurações do navegador."
                : "Não foi possível obter sua localização.",
          });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    },
    [radius]
  );

  const pins: MapPin[] = state.phase === "done" ? state.pins : [];
  const approved = pins.filter((p) => p.status === "approved").length;
  const pending = pins.filter((p) => p.status === "pending").length;
  const none = pins.filter((p) => p.status === "none").length;

  return (
    <main className="max-w-lg mx-auto flex flex-col" style={{ height: "calc(100dvh - 120px)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0 space-y-3">
        <Link href="/mapa" className="inline-flex items-center gap-1 text-sm text-white/45 hover:text-white/80 transition-colors">
          <ChevronLeft className="size-4" />
          Mapa
        </Link>

        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-lg">Locais próximos</h1>
            <p className="text-xs text-white/40 mt-0.5">
              {state.phase === "done"
                ? pins.length === 0
                  ? `Nenhum waypoint em ${radius} km`
                  : `${pins.length} waypoints · ${approved} visitados · ${pending} aguardando · ${none} a visitar`
                : "Waypoints de desafios perto de você"}
            </p>
          </div>

          {/* Radius selector */}
          <div className="flex gap-1 shrink-0">
            {RADII.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRadius(r.value)}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
                style={
                  radius === r.value
                    ? { background: "rgba(249,115,22,0.2)", color: "#f97316", border: "1px solid rgba(249,115,22,0.4)" }
                    : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map / states */}
      <div className="flex-1 px-4 pb-4">
        {state.phase === "idle" && (
          <div className="w-full h-full rounded-xl flex flex-col items-center justify-center gap-4 text-center p-8"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(249,115,22,0.1)", border: "2px solid rgba(249,115,22,0.2)" }}>
              <Navigation className="size-8" style={{ color: "#f97316" }} />
            </div>
            <div>
              <p className="font-semibold text-white">Encontrar waypoints próximos</p>
              <p className="text-sm text-white/40 mt-1">Usaremos sua localização para buscar waypoints de desafios em um raio de {radius} km</p>
            </div>
            <button
              type="button"
              onClick={() => search()}
              className="rounded-full px-6 py-2.5 text-sm font-semibold transition-colors"
              style={{ background: "#f97316", color: "#0c0a09" }}
            >
              Usar minha localização
            </button>
          </div>
        )}

        {(state.phase === "locating" || state.phase === "fetching") && (
          <div className="w-full h-full rounded-xl flex flex-col items-center justify-center gap-3 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(249,115,22,0.4)", borderTopColor: "#f97316" }} />
            <p className="text-sm text-white/50">
              {state.phase === "locating" ? "Obtendo localização…" : "Buscando waypoints próximos…"}
            </p>
          </div>
        )}

        {state.phase === "error" && (
          <div className="w-full h-full rounded-xl flex flex-col items-center justify-center gap-4 text-center p-8"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <p className="text-sm" style={{ color: "#ef4444" }}>{state.message}</p>
            <button type="button" onClick={() => setState({ phase: "idle" })}
              className="rounded-full px-4 py-2 text-xs font-semibold"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {state.phase === "done" && pins.length === 0 && (
          <div className="w-full h-full rounded-xl flex flex-col items-center justify-center gap-4 text-center p-8"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-5xl">🗺️</span>
            <p className="font-semibold">Nenhum waypoint em {radius} km</p>
            <p className="text-sm text-white/40">Tente aumentar o raio de busca</p>
            <button type="button" onClick={() => search(state.coords)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
              style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }}
            >
              <RefreshCw className="size-3.5" />
              Buscar novamente
            </button>
          </div>
        )}

        {state.phase === "done" && pins.length > 0 && (
          <div className="w-full h-full relative">
            <ConquestMap pins={pins} />
            <button
              type="button"
              onClick={() => search(state.coords)}
              className="absolute top-3 right-3 z-[1000] inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg"
              style={{ background: "rgba(12,10,9,0.9)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <RefreshCw className="size-3" />
              Atualizar
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
