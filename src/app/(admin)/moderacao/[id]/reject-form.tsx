"use client";

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

  async function handleReject(formData: FormData) {
    const reason = formData.get("reason") as string;
    await rejectCheckIn(checkInId, reason);
    router.push("/moderacao");
  }

  return (
    <form action={handleReject} className="space-y-5">
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <p className="text-sm font-semibold">Motivo da reprovação</p>
        <div className="space-y-2">
          {REASONS.map((r) => (
            <label key={r} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="reason"
                value={r}
                required
                className="peer sr-only"
              />
              <span className="flex-1 text-sm px-4 py-2.5 rounded-xl border bg-background peer-checked:bg-destructive/10 peer-checked:border-destructive peer-checked:text-destructive group-hover:bg-muted transition-colors">
                {r}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" variant="destructive" className="w-full">
        ✕ Confirmar reprovação
      </Button>
    </form>
  );
}
