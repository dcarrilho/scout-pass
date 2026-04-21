import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Settings, LogOut } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { logout } from "@/app/actions/auth";
import FollowButton from "@/components/social/follow-button";

type Props = { params: Promise<{ username: string }> };

export default async function PerfilPage({ params }: Props) {
  const session = await verifySession();
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      motorcycles: {
        where: { owned_until: null },
        orderBy: { owned_from: "desc" },
      },
    },
  });

  if (!user) notFound();

  const isOwner = session.userId === user.id;

  const [followerCount, followingCount, checkInCount, medals, currentFollow] = await Promise.all([
    prisma.follow.count({ where: { following_id: user.id, status: "ACCEPTED" } }),
    prisma.follow.count({ where: { follower_id: user.id, status: "ACCEPTED" } }),
    prisma.checkIn.count({ where: { user_id: user.id, status: "APPROVED" } }),
    prisma.challenge.findMany({
      where: { checkins: { some: { user_id: user.id, status: "APPROVED" } } },
      include: {
        series: { select: { name: true, icon: true, color: true } },
        _count: { select: { targets: true } },
        checkins: {
          where: { user_id: user.id, status: "APPROVED" },
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    !isOwner
      ? prisma.follow.findUnique({
          where: { follower_id_following_id: { follower_id: session.userId, following_id: user.id } },
        })
      : Promise.resolve(null),
  ]);

  const followStatus = currentFollow?.status === "ACCEPTED"
    ? "accepted"
    : currentFollow?.status === "PENDING"
    ? "pending"
    : "none";

  const isFollowing = followStatus === "accepted";
  const canSeeContent = isOwner || !user.is_private || isFollowing;
  const currentMotos = user.motorcycles;

  return (
    <main className="min-h-screen max-w-lg mx-auto">
      <div className="p-4 pt-6 space-y-5">
        {/* Owner actions */}
        {isOwner && (
          <div className="flex justify-end gap-1">
            <Link
              href="/perfil/editar"
              className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="size-5" />
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
              >
                <LogOut className="size-5" />
              </button>
            </form>
          </div>
        )}

        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted border-2">
              {user.avatar_url ? (
                <Image src={user.avatar_url} alt={user.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                  {user.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold truncate">{user.name}</h2>
              {user.is_private && <span className="text-muted-foreground text-sm">🔒</span>}
            </div>
            {canSeeContent && user.bio && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
            )}
          </div>
        </div>

        {/* Follow button */}
        {!isOwner && (
          <FollowButton
            targetUserId={user.id}
            status={followStatus}
            isPrivate={user.is_private}
          />
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-xl border bg-card p-3 text-center">
            <p className="text-xl font-bold">{checkInCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Check-ins</p>
          </div>
          <div className="rounded-xl border bg-card p-3 text-center">
            <p className="text-xl font-bold">{medals.length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Desafios</p>
          </div>
          <Link href={`/perfil/${user.username}/seguidores`} className="rounded-xl border bg-card p-3 text-center hover:bg-muted/50 transition-colors">
            <p className="text-xl font-bold">{followerCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Seguidores</p>
          </Link>
          <Link href={`/perfil/${user.username}/seguindo`} className="rounded-xl border bg-card p-3 text-center hover:bg-muted/50 transition-colors">
            <p className="text-xl font-bold">{followingCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Seguindo</p>
          </Link>
        </div>

        {/* Private gate */}
        {!canSeeContent && (
          <div className="rounded-xl border bg-card p-8 text-center space-y-2">
            <p className="text-2xl">🔒</p>
            <p className="font-semibold">Perfil privado</p>
            <p className="text-sm text-muted-foreground">Siga para ver as conquistas de {user.name}</p>
          </div>
        )}

        {/* Current motorcycles */}
        {canSeeContent && currentMotos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Garagem</p>
            {currentMotos.map((moto) => (
              <div key={moto.id} className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">🏍️</span>
                <div>
                  <p className="font-semibold text-sm">{moto.brand} {moto.model} {moto.year}</p>
                  {moto.owned_from && (
                    <p className="text-xs text-muted-foreground">desde {moto.owned_from}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mural de medalhas */}
        {canSeeContent && medals.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Medalhas</p>
            <div className="grid grid-cols-3 gap-2">
              {medals.map((challenge) => {
                const done = challenge.checkins.length;
                const total = challenge._count.targets;
                const completed = total > 0 && done >= total;
                return (
                  <div
                    key={challenge.id}
                    className={`rounded-xl border p-3 flex flex-col items-center gap-1 text-center ${
                      completed ? "bg-primary/5 border-primary/30" : "bg-card"
                    }`}
                  >
                    <span className="text-2xl">{completed ? "🏆" : "🎯"}</span>
                    <p className="text-xs font-semibold leading-tight line-clamp-2">{challenge.name}</p>
                    {challenge.series && (
                      <p className="text-[10px] text-muted-foreground truncate w-full">{challenge.series.name}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {done}/{total > 0 ? total : "?"} locais
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Moderação link for mods/admins */}
        {isOwner && (session.role === "MODERATOR" || session.role === "ADMIN") && (
          <Link href="/moderacao" className={buttonVariants({ variant: "outline" }) + " w-full justify-center"}>
            🛡️ Fila de moderação
          </Link>
        )}
      </div>
    </main>
  );
}
