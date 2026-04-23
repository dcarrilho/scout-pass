"use client";

import { useActionState, useRef, useState } from "react";
import { submitCheckIn } from "@/app/actions/checkin";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const MAX_PHOTOS = 5;

type Motorcycle = { id: string; brand: string; model: string; year: number; is_active: boolean };
type Props = { challengeId: string; targetId: string; motorcycles: Motorcycle[] };

export default function CheckInForm({ challengeId, targetId, motorcycles }: Props) {
  const [state, formAction, isPending] = useActionState(submitCheckIn, undefined);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  // pickerRef: opens the OS file dialog
  const pickerRef = useRef<HTMLInputElement>(null);
  // submitRef: hidden input named "photos" that is kept in sync via DataTransfer
  //            and gets submitted with the form naturally
  const submitRef = useRef<HTMLInputElement>(null);

  const syncSubmitInput = (allFiles: File[]) => {
    if (!submitRef.current) return;
    const dt = new DataTransfer();
    allFiles.forEach((f) => dt.items.add(f));
    submitRef.current.files = dt.files;
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setFiles((prev) => {
      const slots = MAX_PHOTOS - prev.length;
      if (slots <= 0) return prev;
      const accepted = Array.from(incoming).slice(0, slots);
      const combined = [...prev, ...accepted];
      syncSubmitInput(combined);
      const newUrls = accepted.map((f) => URL.createObjectURL(f));
      setPreviews((p) => [...p, ...newUrls]);
      return combined;
    });
    if (pickerRef.current) pickerRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      syncSubmitInput(updated);
      return updated;
    });
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="challenge_id" value={challengeId} />
      <input type="hidden" name="target_id" value={targetId} />
      {/* Hidden input submitted with the form — kept in sync via DataTransfer */}
      <input ref={submitRef} name="photos" type="file" accept="image/*" multiple className="hidden" />
      {/* Picker input — only triggers OS dialog, not submitted */}
      <input
        ref={pickerRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Fotos *</Label>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {files.length}/{MAX_PHOTOS}
          </span>
        </div>

        {previews.length > 0 ? (
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
            {files.length < MAX_PHOTOS && (
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
      </div>

      {motorcycles.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="motorcycle_id">Moto utilizada</Label>
          <select
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

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || files.length === 0}
        style={files.length === 0 ? { opacity: 0.5 } : {}}
      >
        {isPending ? "Enviando..." : "Enviar check-in"}
      </Button>
    </form>
  );
}
