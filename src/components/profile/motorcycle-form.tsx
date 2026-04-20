"use client";

import { useActionState, useEffect, useState } from "react";
import { addMotorcycle, editMotorcycle, setActiveMotorcycle, deleteMotorcycle } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MotorcycleEditFormState } from "@/lib/validations";

type Motorcycle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string | null;
  owned_from: Date | null;
  owned_until: Date | null;
  is_active: boolean;
};

function toDateInput(d: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

function formatPeriod(from: Date | null, until: Date | null) {
  const fmt = (d: Date) => new Date(d).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
  if (from && until) return `${fmt(from)} → ${fmt(until)}`;
  if (from) return `desde ${fmt(from)}`;
  return null;
}

function MotorcycleItem({ moto }: { moto: Motorcycle }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<MotorcycleEditFormState, FormData>(editMotorcycle, undefined);

  useEffect(() => {
    if (state?.success) setEditing(false);
  }, [state?.success]);

  const period = formatPeriod(moto.owned_from, moto.owned_until);

  if (!editing) {
    return (
      <li className="rounded-xl border bg-card p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{moto.brand} {moto.model}</span>
              <span className="text-sm text-muted-foreground">{moto.year}</span>
              {moto.is_active && (
                <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">Ativa</span>
              )}
            </div>
            {period && <p className="text-xs text-muted-foreground mt-0.5">{period}</p>}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>Editar</Button>
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
    );
  }

  return (
    <li className="rounded-xl border bg-card p-4">
      <form action={action} className="space-y-3">
        <input type="hidden" name="id" value={moto.id} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor={`brand-${moto.id}`}>Marca</Label>
            <Input id={`brand-${moto.id}`} name="brand" defaultValue={moto.brand} required />
            {state?.errors?.brand && <p className="text-xs text-destructive">{state.errors.brand[0]}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor={`model-${moto.id}`}>Modelo</Label>
            <Input id={`model-${moto.id}`} name="model" defaultValue={moto.model} required />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`year-${moto.id}`}>Ano</Label>
          <Input id={`year-${moto.id}`} name="year" defaultValue={String(moto.year)} maxLength={4} required />
          {state?.errors?.year && <p className="text-xs text-destructive">{state.errors.year[0]}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor={`plate-${moto.id}`}>Placa <span className="text-muted-foreground">(privado)</span></Label>
          <Input id={`plate-${moto.id}`} name="license_plate" defaultValue={moto.license_plate ?? ""} placeholder="ABC-1234" maxLength={10} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor={`from-${moto.id}`}>Proprietário desde</Label>
            <Input id={`from-${moto.id}`} name="owned_from" type="date" defaultValue={toDateInput(moto.owned_from)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`until-${moto.id}`}>Até</Label>
            <Input id={`until-${moto.id}`} name="owned_until" type="date" defaultValue={toDateInput(moto.owned_until)} />
          </div>
        </div>
        {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
        </div>
      </form>
    </li>
  );
}

type Props = { motorcycles: Motorcycle[] };

export default function MotorcycleForm({ motorcycles }: Props) {
  const [state, action, pending] = useActionState(addMotorcycle, undefined);

  return (
    <div className="space-y-6">
      {motorcycles.length > 0 && (
        <ul className="space-y-3">
          {motorcycles.map((moto) => <MotorcycleItem key={moto.id} moto={moto} />)}
        </ul>
      )}

      <form action={action} className="space-y-3 pt-2 border-t">
        <h3 className="font-semibold text-sm">Adicionar moto</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="brand">Marca</Label>
            <Input id="brand" name="brand" placeholder="Honda" required />
            {state?.errors?.brand && <p className="text-xs text-destructive">{state.errors.brand[0]}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="model">Modelo</Label>
            <Input id="model" name="model" placeholder="CB 500" required />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="year">Ano</Label>
          <Input id="year" name="year" placeholder="2022" maxLength={4} required />
          {state?.errors?.year && <p className="text-xs text-destructive">{state.errors.year[0]}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="license_plate">Placa <span className="text-muted-foreground">(privado, opcional)</span></Label>
          <Input id="license_plate" name="license_plate" placeholder="ABC-1234" maxLength={10} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="owned_from">Proprietário desde</Label>
            <Input id="owned_from" name="owned_from" type="date" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="owned_until">Até</Label>
            <Input id="owned_until" name="owned_until" type="date" />
          </div>
        </div>
        {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Adicionando..." : "Adicionar moto"}
        </Button>
      </form>
    </div>
  );
}
