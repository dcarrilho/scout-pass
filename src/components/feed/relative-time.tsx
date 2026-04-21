"use client";

import { useEffect, useState } from "react";

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days}d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function RelativeTime({ date }: { date: Date | null }) {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    if (!date) return;
    const d = new Date(date);
    setText(timeAgo(d));
    const interval = setInterval(() => setText(timeAgo(d)), 60_000);
    return () => clearInterval(interval);
  }, [date]);

  if (!date || !text) return null;
  return (
    <span className="text-xs text-muted-foreground shrink-0">{text}</span>
  );
}
