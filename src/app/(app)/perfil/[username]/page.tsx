import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  const activeMoto = user.motorcycles[0];

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto py-8 space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted border shrink-0">
              {user.avatar_url ? (
                <Image src={user.avatar_url} alt={user.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground">
                  {user.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{user.name}</h1>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              {user.bio && <p className="text-sm mt-2">{user.bio}</p>}
            </div>
          </div>

          {activeMoto && (
            <div className="border rounded-md px-4 py-2 text-sm">
              <span className="text-muted-foreground">Moto: </span>
              <span className="font-medium">{activeMoto.brand} {activeMoto.model} {activeMoto.year}</span>
            </div>
          )}

          {isOwner && (
            <Link href="/perfil/editar" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Editar perfil
            </Link>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
