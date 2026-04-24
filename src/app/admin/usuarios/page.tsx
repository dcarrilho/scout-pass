import Image from "next/image";
import { verifyAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import RoleSelector from "@/components/admin/role-selector";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AdminUsuariosPage({ searchParams }: Props) {
  const session = await verifyAdmin();
  const { q } = await searchParams;

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { username: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      avatar_url: true,
      role: true,
      created_at: true,
      _count: { select: { checkins: true } },
    },
    orderBy: [{ role: "desc" }, { created_at: "asc" }],
    take: 100,
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <form method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou @username…"
          autoComplete="off"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "white",
          }}
        />
      </form>

      {/* Count */}
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
        {users.length} usuário{users.length !== 1 ? "s" : ""}
        {q ? ` para "${q}"` : ""}
      </p>

      {/* List */}
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
              {user.avatar_url ? (
                <Image src={user.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                <span className="text-sm font-bold text-white/70">{user.name[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">{user.name}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                @{user.username} · {user._count.checkins} check-in{user._count.checkins !== 1 ? "s" : ""}
              </p>
            </div>
            <RoleSelector
              userId={user.id}
              currentRole={user.role}
              isSelf={user.id === session.userId}
            />
          </div>
        ))}

        {users.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-white/30 text-sm">Nenhum usuário encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
