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
  owned_from: number | null;
  owned_until: number | null;
  is_active: boolean;
};

function formatPeriod(from: number | null, until: number | null) {
  if (from && until) return `${from} → ${until}`;
  if (from && !until) return `desde ${from} · atual`;
  return null;
}

function MotorcycleItem({ moto }: { moto: Motorcycle }) {
  const [editing, setEditing] = useState(false);
  const [isCurrentMoto, setIsCurrentMoto] = useState(moto.owned_until === null && moto.owned_from !== null);
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{moto.brand} {moto.model}</span>
              <span className="text-sm text-muted-foreground">{moto.year}</span>
              {moto.owned_until === null && moto.owned_from !== null && (
                <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">Atual</span>
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
          <Input id={`year-${moto.id}`} name="year" defaultValue={String(moto.year)} placeholder="2022" maxLength={4} required />
          {state?.errors?.year && <p className="text-xs text-destructive">{state.errors.year[0]}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor={`plate-${moto.id}`}>Placa <span className="text-muted-foreground text-xs">(privado)</span></Label>
          <Input id={`plate-${moto.id}`} name="license_plate" defaultValue={moto.license_plate ?? ""} placeholder="ABC-1234" maxLength={10} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor={`from-${moto.id}`}>Proprietário desde</Label>
            <Input id={`from-${moto.id}`} name="owned_from" defaultValue={moto.owned_from ? String(moto.owned_from) : ""} placeholder="2020" maxLength={4} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`until-${moto.id}`} className={isCurrentMoto ? "text-muted-foreground" : ""}>Até</Label>
            <Input
              id={`until-${moto.id}`}
              name="owned_until"
              defaultValue={moto.owned_until ? String(moto.owned_until) : ""}
              placeholder="2023"
              maxLength={4}
              disabled={isCurrentMoto}
              required={!isCurrentMoto && !!moto.owned_from}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isCurrentMoto}
            onChange={(e) => setIsCurrentMoto(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Moto atual</span>
        </label>
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
  const [isCurrentMoto, setIsCurrentMoto] = useState(true);
  const [hasFrom, setHasFrom] = useState(false);

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
          <Label htmlFor="license_plate">Placa <span className="text-muted-foreground text-xs">(privado, opcional)</span></Label>
          <Input id="license_plate" name="license_plate" placeholder="ABC-1234" maxLength={10} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="owned_from">Proprietário desde</Label>
            <Input
              id="owned_from"
              name="owned_from"
              placeholder="2020"
              maxLength={4}
              onChange={(e) => setHasFrom(e.target.value.length === 4)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="owned_until" className={isCurrentMoto ? "text-muted-foreground" : ""}>Até</Label>
            <Input
              id="owned_until"
              name="owned_until"
              placeholder="2023"
              maxLength={4}
              disabled={isCurrentMoto}
              required={!isCurrentMoto && hasFrom}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isCurrentMoto}
            onChange={(e) => setIsCurrentMoto(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Moto atual</span>
        </label>
        {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Adicionando..." : "Adicionar moto"}
        </Button>
      </form>
    </div>
  );
}
