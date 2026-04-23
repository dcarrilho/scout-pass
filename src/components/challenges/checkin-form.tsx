"use client";

import { useState, useTransition, useRef } from "react";
import { submitCheckIn } from "@/app/actions/checkin";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const MAX_PHOTOS = 5;

function isNextRedirect(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as { digest: unknown }).digest === "string" &&
    (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

type Motorcycle = { id: string; brand: string; model: string; year: number; is_active: boolean };
type Props = { challengeId: string; targetId: string; motorcycles: Motorcycle[] };

export default function CheckInForm({ challengeId, targetId, motorcycles }: Props) {
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  // ref stores files without stale-closure risk
  const filesRef = useRef<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const pickerRef = useRef<HTMLInputElement>(null);
  const motoRef = useRef<HTMLSelectElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const slots = MAX_PHOTOS - filesRef.current.length;
    if (slots <= 0) return;
    const accepted = Array.from(incoming).slice(0, slots);
    filesRef.current = [...filesRef.current, ...accepted];
    setPreviews((p) => [...p, ...accepted.map((f) => URL.createObjectURL(f))]);
    // reset picker so same file can be re-selected and onChange fires again
    if (pickerRef.current) pickerRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    filesRef.current = filesRef.current.filter((_, i) => i !== index);
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);

    const fd = new FormData();
    fd.set("challenge_id", challengeId);
    fd.set("target_id", targetId);
    if (motoRef.current?.value) fd.set("motorcycle_id", motoRef.current.value);
    filesRef.current.forEach((f) => fd.append("photos", f));

    startTransition(async () => {
      try {
        const result = await submitCheckIn(undefined, fd);
        if (result?.error) setError(result.error);
      } catch (e) {
        // redirect() throws NEXT_REDIRECT — re-throw so Next.js handles navigation
        if (isNextRedirect(e)) throw e;
        setError("Erro inesperado. Tente novamente.");
      }
    });
  };

  const photoCount = previews.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Fotos *</Label>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {photoCount}/{MAX_PHOTOS}
          </span>
        </div>

        {photoCount > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((url, i) => (
              <div
                key={url}
                className="relative aspect-square rounded-xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(0,0,0,0.65)", color: "white" }}
                >
                  ×
                </button>
                {i === 0 && (
                  <span
                    className="absolute bottom-1 left-1 text-[10px] font-semibold rounded px-1"
                    style={{ background: "rgba(249,115,22,0.85)", color: "white" }}
                  >
                    capa
                  </span>
                )}
              </div>
            ))}
            {photoCount < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => pickerRef.current?.click()}
                className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "2px dashed rgba(255,255,255,0.15)",
                }}
              >
                <span className="text-xl" style={{ color: "rgba(255,255,255,0.3)" }}>+</span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Adicionar
                </span>
              </button>
            )}
          </div>
        ) : (
          <div
            className="rounded-xl p-8 text-center cursor-pointer transition-colors"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "2px dashed rgba(255,255,255,0.15)",
            }}
            onClick={() => pickerRef.current?.click()}
          >
            <p className="text-2xl mb-2">📷</p>
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
              Toque para adicionar fotos
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              Até {MAX_PHOTOS} fotos · máx. 10MB cada
            </p>
          </div>
        )}

        <input
          ref={pickerRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {motorcycles.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="motorcycle_id">Moto utilizada</Label>
          <select
            ref={motoRef}
            id="motorcycle_id"
            name="motorcycle_id"
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">Não informar</option>
            {motorcycles.map((m) => (
              <option key={m.id} value={m.id}>
                {m.brand} {m.model} {m.year}
                {m.is_active ? " (ativa)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || photoCount === 0}
        style={photoCount === 0 ? { opacity: 0.5 } : {}}
      >
        {isPending ? "Enviando..." : "Enviar check-in"}
      </Button>
    </form>
  );
}
