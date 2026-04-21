import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { verifyModerator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import RejectForm from "./reject-form";

type Props = { params: Promise<{ id: string }> };

export default async function RejectPage({ params }: Props) {
  await verifyModerator();
  const { id } = await params;

  const checkin = await prisma.checkIn.findUnique({
    where: { id, status: "PENDING" },
    include: {
      user: { select: { name: true, username: true } },
      challenge: { select: { name: true } },
      target: { select: { name: true } },
    },
  });

  if (!checkin) notFound();

  return (
    <main className="min-h-screen max-w-lg mx-auto">
      <div className="px-4 pt-6 pb-2 flex items-center gap-3">
        <Link href="/moderacao" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Fila
        </Link>
        <h1 className="text-xl font-bold">Reprovar check-in</h1>
      </div>

      <div className="p-4 space-y-4">
        <article className="rounded-2xl border bg-card overflow-hidden shadow-sm">
          {/* Photo */}
          <div className="relative w-full aspect-[4/3] bg-muted">
            <Image src={checkin.photo_url} alt="Check-in" fill className="object-cover" />
          </div>

          {/* Meta */}
          <div className="px-4 py-3 space-y-1">
            <p className="font-semibold text-sm">{checkin.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {checkin.target.name} · {checkin.challenge.name}
            </p>
          </div>
        </article>

        <RejectForm checkInId={id} />
      </div>
    </main>
  );
}
