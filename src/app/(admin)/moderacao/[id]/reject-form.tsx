"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rejectCheckIn } from "@/app/actions/moderation";
import { Button } from "@/components/ui/button";

const REASONS = [
  "Foto fora do local declarado",
  "Foto sem qualidade suficiente",
  "Local não identificável na foto",
  "Foto duplicada",
  "Outro",
];

export default function RejectForm({ checkInId }: { checkInId: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");

  const isOther = selected === "Outro";
  const finalReason = isOther ? custom.trim() : selected;
  const canSubmit = selected !== "" && (!isOther || custom.trim().length > 0);

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    await rejectCheckIn(checkInId, finalReason);
    router.push("/moderacao");
  }

  return (
    <form onSubmit={handleReject} className="space-y-5">
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <p className="text-sm font-semibold">Motivo da reprovação *</p>
        <div className="space-y-2">
          {REASONS.map((r) => (
            <label key={r} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="reason"
                value={r}
                checked={selected === r}
                onChange={() => setSelected(r)}
                className="peer sr-only"
              />
              <span className="flex-1 text-sm px-4 py-2.5 rounded-xl border bg-background peer-checked:bg-destructive/10 peer-checked:border-destructive peer-checked:text-destructive group-hover:bg-muted transition-colors">
                {r}
              </span>
            </label>
          ))}
        </div>

        {isOther && (
          <textarea
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Descreva o motivo..."
            required
            autoFocus
            rows={3}
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-destructive/50"
          />
        )}
      </div>

      <Button type="submit" variant="destructive" className="w-full" disabled={!canSubmit}>
        ✕ Confirmar reprovação
      </Button>
    </form>
  );
}
