import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";

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

  const [checkInCount, challengeGroups] = await Promise.all([
    prisma.checkIn.count({ where: { user_id: user.id, status: "APPROVED" } }),
    prisma.checkIn.groupBy({
      by: ["challenge_id"],
      where: { user_id: user.id, status: "APPROVED" },
    }),
  ]);

  const isOwner = session.userId === user.id;
  const activeMoto = user.motorcycles[0];

  return (
    <main className="min-h-screen max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <h1 className="text-lg font-bold flex-1 truncate">@{user.username}</h1>
        {isOwner && (
          <Link href="/perfil/editar" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Editar
          </Link>
        )}
      </header>

      <div className="p-4 space-y-5">
        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted border-2 shrink-0">
            {user.avatar_url ? (
              <Image src={user.avatar_url} alt={user.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                {user.name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{user.name}</h2>
            {user.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold">{checkInCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Check-ins</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold">{challengeGroups.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Desafios</p>
          </div>
        </div>

        {/* Active motorcycle */}
        {activeMoto && (
          <div className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">🏍️</span>
            <div>
              <p className="text-xs text-muted-foreground">Moto ativa</p>
              <p className="font-semibold text-sm">{activeMoto.brand} {activeMoto.model} {activeMoto.year}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
