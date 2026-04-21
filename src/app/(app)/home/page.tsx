import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { toggleReaction, addComment, deleteComment } from "@/app/actions/feed";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await verifySession();

  const recentCheckIns = await prisma.checkIn.findMany({
    where: { status: "APPROVED" },
    include: {
      user: { select: { name: true, username: true, avatar_url: true } },
      challenge: { select: { name: true } },
      target: { select: { name: true } },
      reactions: { select: { id: true, user_id: true } },
      comments: {
        include: { user: { select: { id: true, name: true, username: true, avatar_url: true } } },
        orderBy: { created_at: "asc" },
      },
    },
    orderBy: { reviewed_at: "desc" },
    take: 20,
  });

  return (
    <main className="max-w-lg mx-auto">
      <div className="py-4 px-4 space-y-5">
        {recentCheckIns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <span className="text-5xl">🏍️</span>
            <p className="font-semibold text-lg">Nenhuma conquista ainda</p>
            <p className="text-sm text-muted-foreground">Seja o primeiro a completar um check-in!</p>
          </div>
        ) : (
          recentCheckIns.map((checkin) => (
            <FeedCard key={checkin.id} checkin={checkin} currentUserId={session.userId} />
          ))
        )}
      </div>
    </main>
  );
}

type FeedCheckin = {
  id: string;
  photo_url: string;
  reviewed_at: Date | null;
  user: { name: string; username: string; avatar_url: string | null };
  challenge: { name: string };
  target: { name: string };
  reactions: { id: string; user_id: string }[];
  comments: {
    id: string;
    content: string;
    created_at: Date;
    user: { id: string; name: string; username: string; avatar_url: string | null };
  }[];
};

function FeedCard({ checkin, currentUserId }: { checkin: FeedCheckin; currentUserId: string }) {
  const reacted = checkin.reactions.some((r) => r.user_id === currentUserId);
  const reactionCount = checkin.reactions.length;

  return (
    <article className="rounded-2xl overflow-hidden border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-muted border shrink-0 overflow-hidden flex items-center justify-center">
          {checkin.user.avatar_url ? (
            <Image src={checkin.user.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
          ) : (
            <span className="text-sm font-semibold">{checkin.user.name[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">{checkin.user.name}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {checkin.target.name} · {checkin.challenge.name}
          </p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {checkin.reviewed_at
            ? new Date(checkin.reviewed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
            : ""}
        </span>
      </div>

      {/* Foto */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={checkin.photo_url} alt="Check-in" className="w-full aspect-[4/3] object-cover" />

      {/* Ações */}
      <div className="px-4 pt-2 pb-1 flex items-center gap-3">
        <form action={toggleReaction.bind(null, checkin.id)}>
          <button
            type="submit"
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              reacted ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-base">🏍️</span>
            <span>{reactionCount > 0 ? reactionCount : ""}</span>
          </button>
        </form>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-3 py-1 ml-auto">
          ✅ {checkin.challenge.name}
        </span>
      </div>

      {/* Comentários */}
      {checkin.comments.length > 0 && (
        <ul className="px-4 pb-2 space-y-1.5">
          {checkin.comments.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-sm">
              <span className="font-semibold shrink-0">{c.user.name}</span>
              <span className="text-muted-foreground flex-1">{c.content}</span>
              {c.user.id === currentUserId && (
                <form action={deleteComment.bind(null, c.id)}>
                  <button type="submit" className="text-xs text-muted-foreground hover:text-destructive shrink-0">
                    ×
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Formulário de comentário */}
      <form
        action={addComment}
        className="flex items-center gap-2 px-4 pb-3"
      >
        <input type="hidden" name="checkin_id" value={checkin.id} />
        <input
          name="content"
          placeholder="Adicionar comentário…"
          maxLength={280}
          autoComplete="off"
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
        />
        <Button type="submit" size="sm" variant="ghost" className="shrink-0 text-xs">
          Publicar
        </Button>
      </form>
    </article>
  );
}
