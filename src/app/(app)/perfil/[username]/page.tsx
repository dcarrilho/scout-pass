import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Settings, LogOut } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";
import FollowButton from "@/components/social/follow-button";
import { ProfileTabs } from "@/components/profile/profile-tabs";

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

  const [followerCount, followingCount, checkInCount, medals, recentCheckIns, currentFollow] =
    await Promise.all([
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
      prisma.checkIn.findMany({
        where: { user_id: user.id, status: "APPROVED" },
        include: {
          target: { select: { name: true } },
          challenge: { select: { name: true } },
        },
        orderBy: { reviewed_at: "desc" },
        take: 9,
      }),
      !isOwner
        ? prisma.follow.findUnique({
            where: { follower_id_following_id: { follower_id: session.userId, following_id: user.id } },
          })
        : Promise.resolve(null),
    ]);

  const followStatus =
    currentFollow?.status === "ACCEPTED"
      ? "accepted"
      : currentFollow?.status === "PENDING"
      ? "pending"
      : "none";

  const isFollowing = followStatus === "accepted";
  const canSeeContent = isOwner || !user.is_private || isFollowing;

  const stats = [
    { label: "Check-ins", value: checkInCount, href: null },
    { label: "Conquistas", value: medals.length, href: null },
    { label: "Seguidores", value: followerCount, href: `/perfil/${user.username}/seguidores` },
    { label: "Seguindo", value: followingCount, href: `/perfil/${user.username}/seguindo` },
  ];

  return (
    <main className="min-h-screen max-w-lg mx-auto">
      {/* Cover banner */}
      <div className="relative h-36 overflow-hidden" style={!user.cover_url ? {
        background: `
          radial-gradient(ellipse at 15% 120%, rgba(249,115,22,0.22), transparent 55%),
          radial-gradient(ellipse at 85% -20%, rgba(249,115,22,0.08), transparent 50%),
          repeating-linear-gradient(135deg, #1a1614 0 10px, #141210 10px 20px)
        `,
      } : undefined}>
        {user.cover_url && (
          <Image src={user.cover_url} alt="Capa" fill className="object-cover" />
        )}
        {/* Owner actions */}
        {isOwner && (
          <div className="absolute top-3 right-3 flex gap-1 z-10">
            <Link
              href="/perfil/editar"
              className="w-9 h-9 flex items-center justify-center rounded-full transition-colors text-white/60 hover:text-white"
              style={{ background: "rgba(0,0,0,0.35)" }}
            >
              <Settings className="size-4" />
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="w-9 h-9 flex items-center justify-center rounded-full transition-colors text-white/60 hover:text-red-400"
                style={{ background: "rgba(0,0,0,0.35)" }}
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        )}

        {/* Avatar — overlaps cover */}
        <div
          className="absolute -bottom-12 left-4"
          style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}
        >
          <div
            className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold text-white/80"
            style={{ background: "#1e1a17", border: "3px solid #0c0a09" }}
          >
            {user.avatar_url ? (
              <Image src={user.avatar_url} alt={user.name} fill className="object-cover" />
            ) : (
              user.name[0]?.toUpperCase()
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-16 pb-4 space-y-4">
        {/* Name + bio */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{user.name}</h1>
            {user.is_private && <span className="text-white/40 text-sm">🔒</span>}
          </div>
          <p className="text-sm text-white/40">@{user.username}</p>
          {canSeeContent && user.bio && (
            <p className="text-sm text-white/70 mt-2 leading-relaxed">{user.bio}</p>
          )}
        </div>

        {/* Stats row */}
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {stats.map(({ label, value, href }, i) => {
            const content = (
              <>
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
              </>
            );
            const cls = `flex-1 py-3 flex flex-col items-center ${i < stats.length - 1 ? "border-r" : ""}`;
            const style = { borderColor: "rgba(255,255,255,0.06)" };
            return href ? (
              <Link key={label} href={href} className={cls + " hover:bg-white/05 transition-colors"} style={style}>
                {content}
              </Link>
            ) : (
              <div key={label} className={cls} style={style}>{content}</div>
            );
          })}
        </div>

        {/* Follow button */}
        {!isOwner && (
          <FollowButton
            targetUserId={user.id}
            status={followStatus}
            isPrivate={user.is_private}
          />
        )}

        {/* Moderation link */}
        {isOwner && (session.role === "MODERATOR" || session.role === "ADMIN") && (
          <Link
            href="/moderacao"
            className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-sm font-medium transition-colors text-white/60 hover:text-white"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            🛡️ Fila de moderação
          </Link>
        )}

        {/* Private gate */}
        {!canSeeContent && (
          <div
            className="rounded-xl p-8 text-center space-y-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-2xl">🔒</p>
            <p className="font-semibold text-white">Perfil privado</p>
            <p className="text-sm text-white/40">Siga para ver as conquistas de {user.name}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      {canSeeContent && (
        <ProfileTabs
          medals={medals}
          motorcycles={user.motorcycles}
          recentCheckIns={recentCheckIns}
          username={user.username}
        />
      )}
    </main>
  );
}
