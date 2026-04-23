import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { verifyCanModerate } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import RejectForm from "./reject-form";

type Props = { params: Promise<{ id: string }> };

export default async function RejectPage({ params }: Props) {
  await verifyCanModerate();
  const { id } = await params;

  const checkin = await prisma.checkIn.findUnique({
    where: { id, status: "PENDING" },
    include: {
      user: { select: { name: true, username: true, avatar_url: true } },
      challenge: { select: { name: true } },
      target: { select: { name: true } },
      motorcycle: { select: { brand: true, model: true, year: true } },
      photos: { select: { url: true, order: true }, orderBy: { order: "asc" } },
    },
  });

  if (!checkin) notFound();

  return (
    <main className="min-h-screen max-w-lg mx-auto">

      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <Link
          href="/moderacao"
          className="inline-flex items-center gap-1 text-sm text-white/45 hover:text-white/80 transition-colors"
        >
          <ChevronLeft className="size-4" />
          Fila de moderação
        </Link>
        <h1 className="text-xl font-bold text-white mt-3">Reprovar check-in</h1>
      </div>

      <div className="px-4 pb-8 space-y-4">

        {/* Check-in card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#161412", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Photo(s) */}
          <div className="relative w-full aspect-video bg-black/40">
            <Image src={checkin.photos[0]?.url ?? checkin.photo_url ?? ""} alt="Check-in" fill className="object-cover" />
            <div
              className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-10"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }}
            >
              <p className="text-sm font-semibold text-white">{checkin.target.name}</p>
              <p className="text-xs text-white/50 mt-0.5">{checkin.challenge.name}</p>
            </div>
          </div>
          {checkin.photos.length > 1 && (
            <div className="flex gap-1.5 px-3 py-2 overflow-x-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {checkin.photos.map((photo, i) => (
                <div key={photo.order} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                  <Image src={photo.url} alt={`Foto ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* User info */}
          <div className="px-4 py-3 flex items-center gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-9 h-9 rounded-full bg-white/10 shrink-0 overflow-hidden border border-white/15 flex items-center justify-center">
              {checkin.user.avatar_url ? (
                <Image src={checkin.user.avatar_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
              ) : (
                <span className="text-sm font-bold text-white">{checkin.user.name[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{checkin.user.name}</p>
              <p className="text-xs text-white/40">@{checkin.user.username}</p>
            </div>
            {checkin.motorcycle && (
              <p className="text-xs text-white/35 text-right shrink-0">
                🏍️ {checkin.motorcycle.brand}<br />{checkin.motorcycle.year}
              </p>
            )}
          </div>
        </div>

        {/* Reject form */}
        <RejectForm checkInId={id} />
      </div>
    </main>
  );
}
