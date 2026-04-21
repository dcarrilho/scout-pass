import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import dynamic from "next/dynamic";
import type { MapPin } from "@/components/map/conquest-map";

const ConquestMap = dynamic(() => import("@/components/map/conquest-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-xl bg-muted animate-pulse flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Carregando mapa…</p>
    </div>
  ),
});

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

  const targets = await prisma.challengeTarget.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      checkins: { some: { user_id: targetUserId, status: "APPROVED" } },
    },
    include: { challenge: { select: { name: true } } },
  });

  const pins: MapPin[] = targets.map((t) => ({
    id: t.id,
    name: t.name,
    challengeName: t.challenge.name,
    lat: t.latitude!,
    lng: t.longitude!,
  }));

  const displayName = profileUser?.name ?? "Seus";

  return (
    <main className="max-w-lg mx-auto flex flex-col" style={{ height: "calc(100dvh - 120px)" }}>
      <div className="px-4 pt-4 pb-2 shrink-0">
        <h1 className="font-bold text-lg">
          {profileUser ? `Conquistas de ${displayName}` : "Minhas Conquistas"}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {pins.length === 0
            ? "Nenhum local conquistado ainda"
            : `${pins.length} local${pins.length !== 1 ? "is" : ""} conquistado${pins.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      <div className="flex-1 px-4 pb-4">
        {pins.length === 0 ? (
          <div className="w-full h-full rounded-xl border bg-card flex flex-col items-center justify-center gap-3 text-center p-8">
            <span className="text-5xl">🗺️</span>
            <p className="font-semibold">Nenhum local no mapa ainda</p>
            <p className="text-sm text-muted-foreground">
              Complete um check-in para ver sua conquista aqui!
            </p>
          </div>
        ) : (
          <ConquestMap pins={pins} />
        )}
      </div>
    </main>
  );
}
