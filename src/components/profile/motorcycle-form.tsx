"use client";

import { useActionState } from "react";
import { addMotorcycle, setActiveMotorcycle, deleteMotorcycle } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Motorcycle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  is_active: boolean;
};

type Props = { motorcycles: Motorcycle[] };

export default function MotorcycleForm({ motorcycles }: Props) {
  const [state, action, pending] = useActionState(addMotorcycle, undefined);

  return (
    <div className="space-y-6">
      {motorcycles.length > 0 && (
        <ul className="space-y-2">
          {motorcycles.map((moto) => (
            <li key={moto.id} className="flex items-center justify-between border rounded-md px-4 py-2">
              <div>
                <span className="font-medium">{moto.brand} {moto.model}</span>
                <span className="text-sm text-muted-foreground ml-2">{moto.year}</span>
                {moto.is_active && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">Ativa</span>
                )}
              </div>
              <div className="flex gap-2">
                {!moto.is_active && (
                  <form action={setActiveMotorcycle.bind(null, moto.id)}>
                    <Button type="submit" variant="outline" size="sm">Definir ativa</Button>
                  </form>
                )}
                <form action={deleteMotorcycle.bind(null, moto.id)}>
                  <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    Remover
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="space-y-3">
        <h3 className="font-medium">Adicionar moto</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="brand">Marca</Label>
            <Input id="brand" name="brand" placeholder="Honda" required />
            {state?.errors?.brand && <p className="text-xs text-destructive">{state.errors.brand[0]}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="model">Modelo</Label>
            <Input id="model" name="model" placeholder="CB 500" required />
            {state?.errors?.model && <p className="text-xs text-destructive">{state.errors.model[0]}</p>}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="year">Ano</Label>
          <Input id="year" name="year" placeholder="2022" maxLength={4} required />
          {state?.errors?.year && <p className="text-xs text-destructive">{state.errors.year[0]}</p>}
        </div>
        {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Adicionando..." : "Adicionar moto"}
        </Button>
      </form>
    </div>
  );
}
