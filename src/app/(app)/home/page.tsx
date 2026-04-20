import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";

export default async function HomePage() {
  const session = await verifySession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, username: true, role: true },
  });

  const isModerator = user?.role === "MODERATOR" || user?.role === "ADMIN";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Olá, {user?.name?.split(" ")[0]}!</h1>
      <p className="text-muted-foreground text-sm">Bem-vindo ao ScoutPass</p>
      <div className="flex flex-wrap gap-2 justify-center">
        <Link href="/desafios" className={buttonVariants({ variant: "default" })}>
          Ver desafios
        </Link>
        <Link href="/perfil/editar" className={buttonVariants({ variant: "outline" })}>
          Meu perfil
        </Link>
        {isModerator && (
          <Link href="/moderacao" className={buttonVariants({ variant: "secondary" })}>
            Moderação
          </Link>
        )}
      </div>
      <form action={logout} className="mt-4">
        <Button variant="ghost" type="submit" size="sm">Sair</Button>
      </form>
    </main>
  );
}
