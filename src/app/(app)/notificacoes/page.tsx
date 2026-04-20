import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { acceptFollow, declineFollow, acceptGarupaLink, declineGarupaLink } from "@/app/actions/social";
import { Button } from "@/components/ui/button";

export default async function NotificacoesPage() {
  const session = await verifySession();

  const [followRequests, garupaInvites] = await Promise.all([
    prisma.follow.findMany({
      where: { following_id: session.userId, status: "PENDING" },
      include: { follower: { select: { id: true, name: true, username: true, avatar_url: true } } },
      orderBy: { created_at: "desc" },
    }),
    prisma.pilotoGarupa.findMany({
      where: { garupa_id: session.userId, status: "PENDING" },
      include: { piloto: { select: { id: true, name: true, username: true, avatar_url: true } } },
      orderBy: { created_at: "desc" },
    }),
  ]);

  const empty = followRequests.length === 0 && garupaInvites.length === 0;

  return (
    <main className="min-h-screen max-w-lg mx-auto">
      <div className="p-4 pt-6 space-y-6">
        {empty && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <span className="text-5xl">🔔</span>
            <p className="font-semibold">Nenhuma notificação</p>
            <p className="text-sm text-muted-foreground">Tudo em dia por aqui!</p>
          </div>
        )}

        {followRequests.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Solicitações de seguir
            </h2>
            <ul className="space-y-3">
              {followRequests.map((req) => (
                <li key={req.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-muted border shrink-0 overflow-hidden flex items-center justify-center">
                    {req.follower.avatar_url ? (
                      <Image src={req.follower.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-sm font-semibold">{req.follower.name[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{req.follower.name}</p>
                    <p className="text-xs text-muted-foreground">@{req.follower.username}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={acceptFollow.bind(null, req.id)}>
                      <Button type="submit" size="sm">Aceitar</Button>
                    </form>
                    <form action={declineFollow.bind(null, req.id)}>
                      <Button type="submit" size="sm" variant="outline">Recusar</Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {garupaInvites.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Convites de vínculo Piloto/Garupa
            </h2>
            <ul className="space-y-3">
              {garupaInvites.map((inv) => (
                <li key={inv.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-muted border shrink-0 overflow-hidden flex items-center justify-center">
                    {inv.piloto.avatar_url ? (
                      <Image src={inv.piloto.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-sm font-semibold">{inv.piloto.name[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{inv.piloto.name}</p>
                    <p className="text-xs text-muted-foreground">quer te vincular como garupa</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={acceptGarupaLink.bind(null, inv.id)}>
                      <Button type="submit" size="sm">Aceitar</Button>
                    </form>
                    <form action={declineGarupaLink.bind(null, inv.id)}>
                      <Button type="submit" size="sm" variant="outline">Recusar</Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
