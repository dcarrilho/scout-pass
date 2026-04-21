"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function LoadMore({ hasMore, currentTake }: { hasMore: boolean; currentTake: number }) {
  const router = useRouter();
  const params = useSearchParams();

  if (!hasMore) return null;

  const handleClick = () => {
    const p = new URLSearchParams(params.toString());
    p.set("take", String(currentTake + 10));
    router.push(`/home?${p.toString()}`);
  };

  return (
    <div className="flex justify-center pt-2 pb-6">
      <button
        onClick={handleClick}
        className="px-6 py-2 rounded-xl text-sm font-medium bg-muted hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
      >
        Ver mais
      </button>
    </div>
  );
}
