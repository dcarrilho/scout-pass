"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toggleReaction, addComment, deleteComment } from "@/app/actions/feed";
import { Button } from "@/components/ui/button";
import RelativeTime from "./relative-time";

const MAX_COLLAPSED = 2;

export type FeedCheckin = {
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

export function FeedCard({ checkin, currentUserId }: { checkin: FeedCheckin; currentUserId: string }) {
  const [expanded, setExpanded] = useState(false);

  const reacted = checkin.reactions.some((r) => r.user_id === currentUserId);
  const reactionCount = checkin.reactions.length;
  const commentCount = checkin.comments.length;
  const hiddenCount = commentCount - MAX_COLLAPSED;
  const visibleComments = expanded ? checkin.comments : checkin.comments.slice(-MAX_COLLAPSED);

  return (
    <article className="rounded-2xl overflow-hidden border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/perfil/${checkin.user.username}`} className="shrink-0">
          <div className="w-10 h-10 rounded-full bg-muted border overflow-hidden flex items-center justify-center">
            {checkin.user.avatar_url ? (
              <Image src={checkin.user.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
            ) : (
              <span className="text-sm font-semibold">{checkin.user.name[0]?.toUpperCase()}</span>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/perfil/${checkin.user.username}`} className="hover:underline underline-offset-2">
            <p className="font-semibold text-sm leading-tight">{checkin.user.name}</p>
          </Link>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {checkin.target.name} · {checkin.challenge.name}
          </p>
        </div>
        <RelativeTime date={checkin.reviewed_at} />
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
            {reactionCount > 0 && <span>{reactionCount}</span>}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-base">💬</span>
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>

        <span className="text-xs text-muted-foreground bg-muted rounded-full px-3 py-1 ml-auto">
          ✅ {checkin.challenge.name}
        </span>
      </div>

      {/* Comentários */}
      {commentCount > 0 && (
        <ul className="px-4 pb-2 space-y-1.5">
          {hiddenCount > 0 && !expanded && (
            <li>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Ver {hiddenCount} comentário{hiddenCount > 1 ? "s" : ""} anterior{hiddenCount > 1 ? "es" : ""}
              </button>
            </li>
          )}
          {visibleComments.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-sm">
              <Link href={`/perfil/${c.user.username}`} className="font-semibold shrink-0 hover:underline underline-offset-2">
                {c.user.name}
              </Link>
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
          {expanded && commentCount > MAX_COLLAPSED && (
            <li>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Ocultar comentários
              </button>
            </li>
          )}
        </ul>
      )}

      {/* Formulário de comentário */}
      <form action={addComment} className="flex items-center gap-2 px-4 pb-3">
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
