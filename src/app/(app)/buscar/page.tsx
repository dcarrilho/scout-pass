import Image from "next/image";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import SearchInput from "@/components/social/search-input";
import FollowButton from "@/components/social/follow-button";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function BuscarPage({ searchParams }: Props) {
  const session = await verifySession();
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const users = query.length >= 2
    ? await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { username: { contains: query, mode: "insensitive" } },
          ],
          NOT: { id: session.userId },
        },
        select: { id: true, name: true, username: true, avatar_url: true, is_private: true },
        orderBy: { username: "asc" },
        take: 30,
      })
    : [];

  const myFollowing = users.length > 0
    ? await prisma.follow.findMany({
        where: { follower_id: session.userId, following_id: { in: users.map((u) => u.id) } },
        select: { following_id: true, status: true },
      })
    : [];

  const followMap = Object.fromEntries(myFollowing.map((f) => [f.following_id, f.status]));

  return (
    <main className="min-h-screen max-w-lg mx-auto">
      <div className="px-4 pt-4 pb-2">
        <SearchInput defaultValue={query} />
      </div>

      <div className="p-4">
        {query.length > 0 && query.length < 2 && (
          <p className="text-sm text-muted-foreground text-center py-8">Digite ao menos 2 caracteres</p>
        )}

        {query.length >= 2 && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <span className="text-4xl">🔍</span>
            <p className="font-semibold">Nenhum usuário encontrado</p>
            <p className="text-sm text-muted-foreground">Tente outro nome ou @usuário</p>
          </div>
        )}

        {query.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <span className="text-4xl">🏍️</span>
            <p className="font-semibold">Encontre outros aventureiros</p>
            <p className="text-sm text-muted-foreground">Busque por nome ou @usuário</p>
          </div>
        )}

        {users.length > 0 && (
          <ul className="space-y-3">
            {users.map((user) => {
              const rawStatus = followMap[user.id];
              const status = rawStatus === "ACCEPTED" ? "accepted" : rawStatus === "PENDING" ? "pending" : "none";

              return (
                <li key={user.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                  <Link href={`/perfil/${user.username}`} className="w-11 h-11 rounded-full bg-muted border shrink-0 overflow-hidden flex items-center justify-center">
                    {user.avatar_url ? (
                      <Image src={user.avatar_url} alt="" width={44} height={44} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-sm font-semibold">{user.name[0]?.toUpperCase()}</span>
                    )}
                  </Link>
                  <Link href={`/perfil/${user.username}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm truncate">{user.name}</p>
                      {user.is_private && <span className="text-xs text-muted-foreground">🔒</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </Link>
                  <FollowButton targetUserId={user.id} status={status} isPrivate={user.is_private} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
