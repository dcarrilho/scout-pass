"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rejectCheckIn } from "@/app/actions/moderation";

export default function RejectForm({ checkInId }: { checkInId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim() || loading) return;
    setLoading(true);
    await rejectCheckIn(checkInId, reason.trim());
    router.push("/moderacao");
  }

  const canSubmit = reason.trim().length > 0 && !loading;

  return (
    <form onSubmit={handleReject} className="space-y-3">
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>Justificativa da reprovação *</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explique o motivo para que o usuário possa corrigir e reenviar..."
          required
          autoFocus
          rows={4}
          className="w-full rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/25 resize-none outline-none transition-colors"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(239,68,68,0.5)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(239,68,68,0.2)"; }}
        />
        <p className="text-xs text-white/30">
          O usuário será notificado com esta justificativa.
        </p>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl py-3 text-sm font-bold transition-all"
        style={{
          background: canSubmit ? "rgba(239,68,68,0.85)" : "rgba(255,255,255,0.06)",
          color: canSubmit ? "#fff" : "rgba(255,255,255,0.25)",
          cursor: canSubmit ? "pointer" : "not-allowed",
        }}
      >
        {loading ? "Reprovando..." : "✕ Confirmar reprovação"}
      </button>
    </form>
  );
}
