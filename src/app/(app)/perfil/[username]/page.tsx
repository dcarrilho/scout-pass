import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import FollowButton from "@/components/social/follow-button";

type Props = { params: Promise<{ username: string }> };

export default async function PerfilPage({ params }: Props) {
  const session = await verifySession();
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      motorcycles: { where: { is_active: true }, take: 1 },
    },
  });

  if (!user) notFound();

  const isOwner = session.userId === user.id;

  const [followerCount, followingCount, checkInCount, challengeGroups, currentFollow] = await Promise.all([
    prisma.follow.count({ where: { following_id: user.id, status: "ACCEPTED" } }),
    prisma.follow.count({ where: { follower_id: user.id, status: "ACCEPTED" } }),
    prisma.checkIn.count({ where: { user_id: user.id, status: "APPROVED" } }),
    prisma.checkIn.groupBy({ by: ["challenge_id"], where: { user_id: user.id, status: "APPROVED" } }),
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
  const activeMoto = user.motorcycles[0];

  return (
    <main className="min-h-screen max-w-lg mx-auto">
      <div className="p-4 pt-6 space-y-5">
        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border-2">
              {user.avatar_url ? (
                <Image src={user.avatar_url} alt={user.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                  {user.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            {isOwner && (
              <Link
                href="/perfil/editar"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md border-2 border-background"
              >
                <Pencil className="size-3.5" />
              </Link>
            )}
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
            <p className="text-xl font-bold">{challengeGroups.length}</p>
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

        {/* Active motorcycle */}
        {canSeeContent && activeMoto && (
          <div className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">🏍️</span>
            <div>
              <p className="text-xs text-muted-foreground">Moto ativa</p>
              <p className="font-semibold text-sm">{activeMoto.brand} {activeMoto.model} {activeMoto.year}</p>
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
