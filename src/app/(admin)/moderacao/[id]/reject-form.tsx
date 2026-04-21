"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rejectCheckIn } from "@/app/actions/moderation";
import { Button } from "@/components/ui/button";

export default function RejectForm({ checkInId }: { checkInId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    await rejectCheckIn(checkInId, reason.trim());
    router.push("/moderacao");
  }

  return (
    <form onSubmit={handleReject} className="space-y-5">
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <p className="text-sm font-semibold">Justificativa da reprovação *</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Descreva o motivo da reprovação..."
          required
          autoFocus
          rows={4}
          className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-destructive/50"
        />
      </div>

      <Button type="submit" variant="destructive" className="w-full" disabled={!reason.trim()}>
        ✕ Confirmar reprovação
      </Button>
    </form>
  );
}
