import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import ProfileForm from "@/components/profile/profile-form";
import AccountForm from "@/components/profile/account-form";
import MotorcycleForm from "@/components/profile/motorcycle-form";

export default async function EditarPerfilPage() {
  const session = await verifySession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { motorcycles: { orderBy: { created_at: "asc" } } },
  });

  if (!user) return null;

  return (
    <main className="min-h-screen max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">Editar perfil</h1>
        <Link href={`/perfil/${user.username}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Ver perfil
        </Link>
      </header>

      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              name={user.name}
              bio={user.bio}
              avatarUrl={user.avatar_url}
              isPrivate={user.is_private}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountForm username={user.username} email={user.email} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Garagem</CardTitle>
          </CardHeader>
          <CardContent>
            <MotorcycleForm motorcycles={user.motorcycles} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
