"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { rejectCheckIn } from "@/app/actions/moderation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
    <form action={handleReject} className="space-y-4">
      <div className="space-y-2">
        <Label>Motivo da reprovação</Label>
        {REASONS.map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name="reason" value={r} required />
            {r}
          </label>
        ))}
      </div>
      <Button type="submit" variant="destructive" className="w-full">
        Confirmar reprovação
      </Button>
    </form>
  );
}
