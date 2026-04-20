"use client";

import { useActionState, useRef } from "react";
import { submitCheckIn } from "@/app/actions/checkin";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Motorcycle = { id: string; brand: string; model: string; year: number; is_active: boolean };
type Props = { challengeId: string; targetId: string; motorcycles: Motorcycle[] };

export default function CheckInForm({ challengeId, targetId, motorcycles }: Props) {
  const [state, action, pending] = useActionState(submitCheckIn, undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="challenge_id" value={challengeId} />
      <input type="hidden" name="target_id" value={targetId} />

      <div className="space-y-2">
        <Label>Foto *</Label>
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <p className="text-sm text-muted-foreground">Toque para tirar ou escolher uma foto</p>
        </div>
        <input
          ref={fileRef}
          name="photo"
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && fileRef.current) {
              const label = fileRef.current.previousElementSibling;
              if (label) label.textContent = `✓ ${file.name}`;
            }
          }}
        />
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
                {m.brand} {m.model} {m.year}{m.is_active ? " (ativa)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Enviar check-in"}
      </Button>
    </form>
  );
}
