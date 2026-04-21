import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import MapClient from "./map-client";
import type { MapPin } from "@/components/map/conquest-map";

type Props = { searchParams: Promise<{ user?: string }> };

export default async function MapaPage({ searchParams }: Props) {
  const session = await verifySession();
  const { user: usernameParam } = await searchParams;

  let profileUser: { id: string; name: string; username: string } | null = null;

  if (usernameParam) {
    profileUser = await prisma.user.findUnique({
      where: { username: usernameParam },
      select: { id: true, name: true, username: true },
    });
  }

  const targetUserId = profileUser?.id ?? session.userId;

  // Desafios em que o usuário tem pelo menos um check-in
  const participatingChallengeIds = await prisma.checkIn.findMany({
    where: { user_id: targetUserId },
    select: { challenge_id: true },
    distinct: ["challenge_id"],
  });
  const challengeIds = participatingChallengeIds.map((c) => c.challenge_id);

  const [targets, userCheckIns] = await Promise.all([
    prisma.challengeTarget.findMany({
      where: {
        challenge_id: { in: challengeIds },
        latitude: { not: null },
        longitude: { not: null },
      },
      include: { challenge: { select: { name: true } } },
    }),
    prisma.checkIn.findMany({
      where: { user_id: targetUserId, challenge_id: { in: challengeIds } },
      select: { target_id: true, status: true },
    }),
  ]);

  const checkInMap = new Map<string, string>();
  for (const c of userCheckIns) {
    // APPROVED sobrepõe PENDING se houver os dois
    if (!checkInMap.has(c.target_id) || c.status === "APPROVED") {
      checkInMap.set(c.target_id, c.status);
    }
  }

  const pins: MapPin[] = targets.map((t) => {
    const status = checkInMap.get(t.id);
    return {
      id: t.id,
      name: t.name,
      challengeName: t.challenge.name,
      lat: t.latitude!,
      lng: t.longitude!,
      status: status === "APPROVED" ? "approved" : status === "PENDING" ? "pending" : "none",
    };
  });

  const displayName = profileUser?.name ?? "Seus";

  return (
    <main className="max-w-lg mx-auto flex flex-col" style={{ height: "calc(100dvh - 120px)" }}>
      <div className="px-4 pt-4 pb-2 shrink-0">
        <h1 className="font-bold text-lg">
          {profileUser ? `Conquistas de ${displayName}` : "Minhas Conquistas"}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {pins.length === 0
            ? "Nenhum desafio iniciado ainda"
            : (() => {
                const approved = pins.filter((p) => p.status === "approved").length;
                const pending = pins.filter((p) => p.status === "pending").length;
                const none = pins.filter((p) => p.status === "none").length;
                return `${approved} visitados · ${pending} aguardando · ${none} a visitar`;
              })()}
        </p>
      </div>

      <div className="flex-1 px-4 pb-4">
        {pins.length === 0 ? (
          <div className="w-full h-full rounded-xl border bg-card flex flex-col items-center justify-center gap-3 text-center p-8">
            <span className="text-5xl">🗺️</span>
            <p className="font-semibold">Nenhum desafio iniciado</p>
            <p className="text-sm text-muted-foreground">
              Faça um check-in em qualquer desafio para vê-lo aqui!
            </p>
          </div>
        ) : (
          <Suspense fallback={
            <div className="w-full h-full rounded-xl bg-muted animate-pulse flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Carregando mapa…</p>
            </div>
          }>
            <MapClient pins={pins} />
          </Suspense>
        )}
      </div>
    </main>
  );
}
