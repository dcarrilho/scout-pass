import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Shield } from "lucide-react";
import { verifyModerator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { approveCheckIn } from "@/app/actions/moderation";

function timeAgo(date: Date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

export default async function ModeracaoPage() {
  await verifyModerator();

  const pending = await prisma.checkIn.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { name: true, username: true, avatar_url: true } },
      challenge: { select: { name: true } },
      target: { select: { name: true } },
      motorcycle: { select: { brand: true, model: true, year: true } },
      photos: { select: { url: true, order: true }, orderBy: { order: "asc" } },
    },
    orderBy: { submitted_at: "asc" },
  });

  return (
    <main className="min-h-screen max-w-lg mx-auto">

      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-white/40" />
          <h1 className="text-xl font-bold text-white">Moderação</h1>
        </div>
        {pending.length > 0 && (
          <span
            className="text-xs font-bold rounded-full px-3 py-1"
            style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }}
          >
            {pending.length} pendente{pending.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="px-4 pb-8 space-y-4">

        {/* Empty state */}
        {pending.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-24 gap-4 text-center rounded-2xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-5xl">🛡️</span>
            <div>
              <p className="font-semibold text-white">Tudo em dia!</p>
              <p className="text-sm text-white/40 mt-1">Nenhum check-in aguardando revisão.</p>
            </div>
          </div>
        )}

        {pending.map((checkin) => (
          <article
            key={checkin.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: "#161412", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Photo with user overlay */}
            <div className="relative w-full aspect-video bg-black/40">
              <Image src={checkin.photos[0]?.url ?? checkin.photo_url ?? ""} alt="Check-in" fill className="object-cover" />
              {checkin.photos.length > 1 && (
                <span
                  className="absolute top-2 left-2 text-xs font-bold rounded-full px-2 py-0.5"
                  style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
                >
                  📷 {checkin.photos.length}
                </span>
              )}

              {/* Top gradient overlay with user info */}
              <div
                className="absolute inset-x-0 top-0 px-3 pt-3 pb-8 flex items-start gap-2.5"
                style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)" }}
              >
                <div className="w-9 h-9 rounded-full bg-white/10 shrink-0 overflow-hidden border border-white/20 flex items-center justify-center">
                  {checkin.user.avatar_url ? (
                    <Image src={checkin.user.avatar_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-sm font-bold text-white">{checkin.user.name[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight">{checkin.user.name}</p>
                  <p className="text-xs text-white/55">@{checkin.user.username}</p>
                </div>
                <span className="text-xs text-white/45 shrink-0 mt-0.5">{timeAgo(checkin.submitted_at)}</span>
              </div>

              {/* Bottom gradient with location info */}
              <div
                className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-8"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }}
              >
                <p className="text-sm font-semibold text-white leading-snug">{checkin.target.name}</p>
                <p className="text-xs text-white/50 mt-0.5">{checkin.challenge.name}</p>
              </div>
            </div>

            {/* Meta + actions */}
            <div className="px-4 py-3 space-y-3">
              {checkin.motorcycle && (
                <p className="text-xs text-white/40">
                  🏍️ {checkin.motorcycle.brand} {checkin.motorcycle.model} · {checkin.motorcycle.year}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <form action={approveCheckIn.bind(null, checkin.id)}>
                  <button
                    type="submit"
                    className="w-full rounded-xl py-2.5 text-sm font-bold transition-colors"
                    style={{ background: "rgba(22,163,74,0.15)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.3)" }}
                  >
                    ✓ Aprovar
                  </button>
                </form>
                <Link href={`/moderacao/${checkin.id}`} className="block">
                  <button
                    type="button"
                    className="w-full rounded-xl py-2.5 text-sm font-bold transition-colors"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
                  >
                    ✕ Reprovar
                  </button>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
