import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { acceptFollow, declineFollow, acceptGarupaLink, declineGarupaLink, markNotificationsRead } from "@/app/actions/social";

function timeAgo(date: Date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  return (
    <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden flex items-center justify-center border border-white/10" style={{ background: "rgba(255,255,255,0.08)" }}>
      {url ? (
        <Image src={url} alt="" width={40} height={40} className="object-cover w-full h-full" />
      ) : (
        <span className="text-sm font-bold text-white/70">{name[0]?.toUpperCase()}</span>
      )}
    </div>
  );
}

const TYPE_CONFIG: Record<string, { icon: string; label: (n: NotifWithRefs) => string; color: string }> = {
  CHECKIN_APPROVED:      { icon: "✅", color: "#16a34a", label: (n) => `Check-in aprovado em ${n.checkin?.target?.name ?? ""}` },
  CHECKIN_REJECTED:      { icon: "❌", color: "#ef4444", label: (n) => `Check-in reprovado em ${n.checkin?.target?.name ?? ""}` },
  CHECKIN_PENDING_REVIEW:{ icon: "🔔", color: "#f97316", label: (n) => `${n.actor?.name ?? "Alguém"} enviou um check-in para revisar` },
  NEW_FOLLOWER:          { icon: "👤", color: "#f97316", label: (n) => `${n.actor?.name ?? "Alguém"} começou a te seguir` },
  FOLLOW_ACCEPTED:       { icon: "✓",  color: "#16a34a", label: (n) => `${n.actor?.name ?? "Alguém"} aceitou seu pedido de seguir` },
  REACTION:              { icon: "🏍️", color: "#f97316", label: (n) => `${n.actor?.name ?? "Alguém"} curtiu seu check-in` },
  COMMENT:               { icon: "💬", color: "#f97316", label: (n) => `${n.actor?.name ?? "Alguém"} comentou no seu check-in` },
  FIRST_CHECKIN:         { icon: "🎯", color: "#f97316", label: (n) => `Primeiro check-in em ${n.challenge?.name ?? "um desafio"}!` },
  MILESTONE:             { icon: "🏅", color: "#f97316", label: (n) => `Você atingiu ${n.metadata ?? ""}% do desafio ${n.challenge?.name ?? ""}!` },
  CHALLENGE_COMPLETED:   { icon: "🏆", color: "#16a34a", label: (n) => `Você completou o desafio ${n.challenge?.name ?? ""}!` },
  GARUPA_ACCEPTED:       { icon: "🏍️", color: "#16a34a", label: (n) => `${n.actor?.name ?? "Alguém"} aceitou seu vínculo Piloto/Garupa` },
};

type NotifWithRefs = Awaited<ReturnType<typeof getNotifications>>[number];

async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { user_id: userId },
    include: {
      actor: { select: { name: true, username: true, avatar_url: true } },
      checkin: { select: { id: true, rejection_reason: true, target: { select: { name: true } }, challenge: { select: { name: true } } } },
      challenge: { select: { id: true, name: true } },
    },
    orderBy: { created_at: "desc" },
    take: 50,
  });
}

export default async function NotificacoesPage() {
  const session = await verifySession();

  const [followRequests, garupaInvites, notifications] = await Promise.all([
    prisma.follow.findMany({
      where: { following_id: session.userId, status: "PENDING" },
      include: { follower: { select: { id: true, name: true, username: true, avatar_url: true } } },
      orderBy: { created_at: "desc" },
    }),
    prisma.pilotoGarupa.findMany({
      where: { garupa_id: session.userId, status: "PENDING" },
      include: { piloto: { select: { id: true, name: true, username: true, avatar_url: true } } },
      orderBy: { created_at: "desc" },
    }),
    getNotifications(session.userId),
  ]);

  const hasUnread = notifications.some((n) => !n.read);
  const empty = followRequests.length === 0 && garupaInvites.length === 0 && notifications.length === 0;

  return (
    <main className="min-h-screen max-w-lg mx-auto">
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Notificações</h1>
        {hasUnread && (
          <form action={markNotificationsRead.bind(null, session.userId)}>
            <button type="submit" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              Marcar tudo como lido
            </button>
          </form>
        )}
      </div>

      <div className="px-4 pb-8 space-y-3">
        {empty && (
          <div
            className="flex flex-col items-center justify-center py-24 gap-4 text-center rounded-2xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-5xl">🔔</span>
            <div>
              <p className="font-semibold text-white">Tudo em dia!</p>
              <p className="text-sm text-white/40 mt-1">Nenhuma notificação por aqui.</p>
            </div>
          </div>
        )}

        {/* Follow requests */}
        {followRequests.map((req) => (
          <div
            key={req.id}
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)" }}
          >
            <Link href={`/perfil/${req.follower.username}`}>
              <Avatar url={req.follower.avatar_url} name={req.follower.name} />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/90">
                <Link href={`/perfil/${req.follower.username}`} className="font-semibold hover:underline">{req.follower.name}</Link>
                {" "}quer te seguir
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <form action={acceptFollow.bind(null, req.id)}>
                <button type="submit" className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "#f97316", color: "#0c0a09" }}>Aceitar</button>
              </form>
              <form action={declineFollow.bind(null, req.id)}>
                <button type="submit" className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>Recusar</button>
              </form>
            </div>
          </div>
        ))}

        {/* Garupa invites */}
        {garupaInvites.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)" }}
          >
            <Link href={`/perfil/${inv.piloto.username}`}>
              <Avatar url={inv.piloto.avatar_url} name={inv.piloto.name} />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/90">
                <Link href={`/perfil/${inv.piloto.username}`} className="font-semibold hover:underline">{inv.piloto.name}</Link>
                {" "}quer te vincular como garupa 🏍️
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <form action={acceptGarupaLink.bind(null, inv.id)}>
                <button type="submit" className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "#f97316", color: "#0c0a09" }}>Aceitar</button>
              </form>
              <form action={declineGarupaLink.bind(null, inv.id)}>
                <button type="submit" className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>Recusar</button>
              </form>
            </div>
          </div>
        ))}

        {/* All notifications */}
        {notifications.map((n) => {
          const cfg = TYPE_CONFIG[n.type];
          if (!cfg) return null;
          const isUnread = !n.read;

          const content = (
            <div
              key={n.id}
              className="flex items-start gap-3 rounded-xl px-4 py-3 transition-colors"
              style={{
                background: isUnread ? "rgba(249,115,22,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isUnread ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {n.actor ? (
                <Link href={`/perfil/${n.actor.username}`}>
                  <Avatar url={n.actor.avatar_url} name={n.actor.name} />
                </Link>
              ) : (
                <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
                  {cfg.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/90 leading-snug">{cfg.label(n)}</p>
                {n.type === "CHECKIN_REJECTED" && n.checkin?.rejection_reason && (
                  <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{n.checkin.rejection_reason}</p>
                )}
                {(n.checkin || n.challenge) && (
                  <p className="text-xs text-white/35 mt-0.5">
                    {n.checkin?.challenge?.name ?? n.challenge?.name ?? ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isUnread && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />}
                <span className="text-xs text-white/30">{timeAgo(n.created_at)}</span>
              </div>
            </div>
          );

          // Wrap with link if there's a related checkin or challenge
          if (n.checkin?.id) {
            return <Link key={n.id} href={`/moderacao/${n.checkin.id}`}>{content}</Link>;
          }
          if (n.challenge?.id) {
            return <Link key={n.id} href={`/desafios/${n.challenge.id}`}>{content}</Link>;
          }
          if (n.actor) {
            return <Link key={n.id} href={`/perfil/${n.actor.username}`}>{content}</Link>;
          }
          return <div key={n.id}>{content}</div>;
        })}
      </div>
    </main>
  );
}
