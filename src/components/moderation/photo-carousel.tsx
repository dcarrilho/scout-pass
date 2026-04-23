"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  photos: { url: string; order: number }[];
  fallbackUrl?: string | null;
  aspectClass?: string;
};

export default function PhotoCarousel({ photos, fallbackUrl, aspectClass = "aspect-video" }: Props) {
  const urls = photos.length > 0 ? photos.map((p) => p.url) : fallbackUrl ? [fallbackUrl] : [];
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (urls.length === 0) return null;

  const prev = () => setCurrent((i) => (i - 1 + urls.length) % urls.length);
  const next = () => setCurrent((i) => (i + 1) % urls.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  const single = urls.length === 1;

  return (
    <div>
      {/* Main photo */}
      <div
        className={`relative w-full ${aspectClass} bg-black/40 select-none overflow-hidden`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urls[current]}
          alt={`Foto ${current + 1}`}
          className="w-full h-full object-cover"
        />

        {!single && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-opacity"
              style={{ background: "rgba(0,0,0,0.55)" }}
              aria-label="Foto anterior"
            >
              <ChevronLeft className="size-4 text-white" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-opacity"
              style={{ background: "rgba(0,0,0,0.55)" }}
              aria-label="Próxima foto"
            >
              <ChevronRight className="size-4 text-white" />
            </button>

            <span
              className="absolute top-2 right-2 text-xs font-semibold rounded-full px-2.5 py-0.5"
              style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
            >
              {current + 1}/{urls.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {!single && (
        <div
          className="flex gap-1.5 px-3 py-2 overflow-x-auto"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setCurrent(i)}
              className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 transition-all"
              style={{
                outline: i === current ? "2px solid #f97316" : "2px solid transparent",
                opacity: i === current ? 1 : 0.5,
              }}
              aria-label={`Ver foto ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
