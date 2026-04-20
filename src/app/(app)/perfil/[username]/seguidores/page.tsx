import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import FollowButton from "@/components/social/follow-button";

type Props = { params: Promise<{ username: string }> };

export default async function SeguidoresPage({ params }: Props) {
  const session = await verifySession();
  const { username } = await params;

  const user = await prisma.user.findUnique({ where: { username }, select: { id: true, name: true } });
  if (!user) notFound();

  const followers = await prisma.follow.findMany({
    where: { following_id: user.id, status: "ACCEPTED" },
    include: { follower: { select: { id: true, name: true, username: true, avatar_url: true, is_private: true } } },
    orderBy: { created_at: "desc" },
  });

  const myFollowing = await prisma.follow.findMany({
    where: { follower_id: session.userId, following_id: { in: followers.map((f) => f.follower.id) } },
    select: { following_id: true, status: true },
  });

  const followMap = Object.fromEntries(myFollowing.map((f) => [f.following_id, f.status]));

  return (
    <main className="min-h-screen max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Link href={`/perfil/${username}`} className="text-muted-foreground hover:text-foreground">←</Link>
        <h1 className="text-lg font-bold">Seguidores de {user.name}</h1>
      </header>

      <div className="p-4">
        {followers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <span className="text-4xl">👥</span>
            <p className="font-semibold">Nenhum seguidor ainda</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {followers.map(({ follower }) => {
              const rawStatus = followMap[follower.id];
              const status = rawStatus === "ACCEPTED" ? "accepted" : rawStatus === "PENDING" ? "pending" : "none";
              const isMe = session.userId === follower.id;

              return (
                <li key={follower.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                  <Link href={`/perfil/${follower.username}`} className="w-10 h-10 rounded-full bg-muted border shrink-0 overflow-hidden flex items-center justify-center">
                    {follower.avatar_url ? (
                      <Image src={follower.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-sm font-semibold">{follower.name[0]?.toUpperCase()}</span>
                    )}
                  </Link>
                  <Link href={`/perfil/${follower.username}`} className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{follower.name}</p>
                    <p className="text-xs text-muted-foreground">@{follower.username}</p>
                  </Link>
                  {!isMe && (
                    <FollowButton targetUserId={follower.id} status={status} isPrivate={follower.is_private} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
