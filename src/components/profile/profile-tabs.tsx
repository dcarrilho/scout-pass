"use client";

import { useState } from "react";
import Link from "next/link";

type Medal = {
  id: string;
  name: string;
  checkins: { id: string }[];
  _count: { targets: number };
  series: { name: string; icon: string | null; color: string | null } | null;
};

type Motorcycle = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  owned_from: number | null;
};

type RecentCheckIn = {
  id: string;
  photo_url: string | null;
  target: { name: string };
  challenge: { name: string };
  photos: { url: string; order: number }[];
};

type Props = {
  medals: Medal[];
  motorcycles: Motorcycle[];
  recentCheckIns: RecentCheckIn[];
  username: string;
};

type Tab = "conquistas" | "garagem" | "checkins";

const TABS: { key: Tab; label: string; count?: (p: Props) => number }[] = [
  { key: "checkins", label: "Check-ins", count: (p) => p.recentCheckIns.length },
  { key: "conquistas", label: "Conquistas", count: (p) => p.medals.length },
  { key: "garagem", label: "Garagem", count: (p) => p.motorcycles.length },
];

export function ProfileTabs(props: Props) {
  const { medals, motorcycles, recentCheckIns, username } = props;
  const [tab, setTab] = useState<Tab>("checkins");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative flex items-center justify-center gap-1.5 ${
              tab === key ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            {label}
            {count && count(props) > 0 && (
              <span className="text-[10px] tabular-nums" style={{ color: tab === key ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)" }}>
                {count(props)}
              </span>
            )}
            {tab === key && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#f97316] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {/* Conquistas */}
        {tab === "conquistas" && (
          medals.length === 0 ? (
            <EmptyState icon="🎯" text="Nenhuma conquista ainda" />
          ) : (
            <>
              <div className="flex justify-end mb-3">
                <Link href={`/mapa?user=${username}`} className="text-xs font-medium" style={{ color: "#f97316" }}>
                  Ver no mapa →
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {medals.map((challenge) => {
                  const done = challenge.checkins.length;
                  const total = challenge._count.targets;
                  const completed = total > 0 && done >= total;
                  return (
                    <div
                      key={challenge.id}
                      className="rounded-xl p-3 flex flex-col items-center gap-1 text-center"
                      style={{
                        background: completed ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.04)",
                        border: completed ? "1px solid rgba(249,115,22,0.25)" : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <span className="text-2xl">{completed ? "🏆" : "🎯"}</span>
                      <p className="text-xs font-semibold leading-tight line-clamp-2 text-white/90">{challenge.name}</p>
                      {challenge.series && (
                        <p className="text-[10px] text-white/40 truncate w-full">{challenge.series.name}</p>
                      )}
                      <p className="text-[10px] text-white/40 mt-0.5">{done}/{total > 0 ? total : "?"} locais</p>
                    </div>
                  );
                })}
              </div>
            </>
          )
        )}

        {/* Garagem */}
        {tab === "garagem" && (
          motorcycles.length === 0 ? (
            <EmptyState icon="🏍️" text="Nenhuma moto cadastrada" />
          ) : (
            <div className="space-y-2">
              {motorcycles.map((moto) => (
                <div
                  key={moto.id}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span className="text-2xl">🏍️</span>
                  <div>
                    <p className="font-semibold text-sm text-white/90">{moto.brand} {moto.model} {moto.year}</p>
                    {moto.owned_from && (
                      <p className="text-xs text-white/40">desde {moto.owned_from}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Check-ins */}
        {tab === "checkins" && (
          recentCheckIns.length === 0 ? (
            <EmptyState icon="📍" text="Nenhum check-in ainda" />
          ) : (
            <div className="grid grid-cols-3 gap-0.5 -mx-4 overflow-hidden">
              {recentCheckIns.map((ci) => (
                <div key={ci.id} className="relative aspect-square overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ci.photos[0]?.url ?? ci.photo_url ?? ""} alt={ci.target.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-end p-1.5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)" }}>
                    <p className="text-[10px] text-white font-medium leading-tight line-clamp-1">{ci.target.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm text-white/40">{text}</p>
    </div>
  );
}
