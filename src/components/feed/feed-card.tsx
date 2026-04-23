"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { toggleReaction, addComment, deleteComment } from "@/app/actions/feed";
import { Button } from "@/components/ui/button";
import RelativeTime from "./relative-time";

const MAX_COLLAPSED = 2;

export type FeedCheckin = {
  id: string;
  photo_url: string | null;
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
  photos: { url: string; order: number }[];
};

export function FeedCard({ checkin, currentUserId }: { checkin: FeedCheckin; currentUserId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [reacted, setReacted] = useState(
    checkin.reactions.some((r) => r.user_id === currentUserId)
  );
  const [reactionCount, setReactionCount] = useState(checkin.reactions.length);
  const [bump, setBump] = useState(false);
  const [, startTransition] = useTransition();

  const handleReaction = () => {
    const next = !reacted;
    setReacted(next);
    setReactionCount((c) => c + (next ? 1 : -1));
    setBump(true);
    setTimeout(() => setBump(false), 300);
    startTransition(() => toggleReaction(checkin.id));
  };
  const commentCount = checkin.comments.length;
  const hiddenCount = commentCount - MAX_COLLAPSED;
  const visibleComments = expanded ? checkin.comments : checkin.comments.slice(-MAX_COLLAPSED);

  return (
    <article className="rounded-2xl overflow-hidden border shadow-sm" style={{ background: "#161412", borderColor: "rgba(255,255,255,0.06)" }}>
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

      {/* Foto(s) */}
      {(() => {
        const coverUrl = checkin.photos[0]?.url ?? checkin.photo_url;
        const count = checkin.photos.length;
        if (!coverUrl) return null;
        return (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="Check-in" className="w-full aspect-[4/3] object-cover" />
            {count > 1 && (
              <span
                className="absolute top-2 right-2 text-xs font-bold rounded-full px-2 py-0.5 flex items-center gap-1"
                style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
              >
                📷 {count}
              </span>
            )}
          </div>
        );
      })()}

      {/* Ações */}
      <div className="px-4 pt-2 pb-1 flex items-center gap-3">
        <button
          type="button"
          onClick={handleReaction}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors select-none ${
            reacted ? "text-red-500" : "text-white/50 hover:text-white/80"
          }`}
        >
          <span
            className="transition-transform duration-150"
            style={{ transform: bump ? "scale(1.35)" : "scale(1)", display: "flex" }}
          >
            {reacted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            )}
          </span>
          <span className="tabular-nums w-4 text-left">
            {reactionCount > 0 ? reactionCount : ""}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-base">💬</span>
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>

        <span
          className="text-xs font-medium rounded-full px-3 py-1 ml-auto flex items-center gap-1.5"
          style={{ background: "rgba(22,163,74,0.12)", color: "#16a34a" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] inline-block" />
          {checkin.challenge.name}
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
                className="text-xs text-white/35 hover:text-white/70 transition-colors"
              >
                Ver {hiddenCount} comentário{hiddenCount > 1 ? "s" : ""} anterior{hiddenCount > 1 ? "es" : ""}
              </button>
            </li>
          )}
          {visibleComments.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-sm">
              <Link href={`/perfil/${c.user.username}`} className="font-semibold shrink-0 hover:underline underline-offset-2 text-white/90">
                {c.user.name}
              </Link>
              <span className="text-white/55 flex-1">{c.content}</span>
              {c.user.id === currentUserId && (
                <form action={deleteComment.bind(null, c.id)}>
                  <button type="submit" className="text-xs text-white/30 hover:text-red-400 shrink-0">
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
                className="text-xs text-white/35 hover:text-white/70 transition-colors"
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
          className="flex-1 text-sm bg-transparent outline-none text-white/90 placeholder:text-white/30"
        />
        <Button type="submit" size="sm" variant="ghost" className="shrink-0 text-xs">
          Publicar
        </Button>
      </form>
    </article>
  );
}
