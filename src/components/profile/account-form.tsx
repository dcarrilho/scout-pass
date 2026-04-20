"use client";

import { useActionState } from "react";
import { updateAccount } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = { username: string; email: string };

export default function AccountForm({ username, email }: Props) {
  const [state, action, pending] = useActionState(updateAccount, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Usuário</Label>
        <Input id="username" name="username" defaultValue={username} required />
        <p className="text-xs text-muted-foreground">Apenas letras minúsculas, números e _</p>
        {state?.errors?.username && <p className="text-xs text-destructive">{state.errors.username[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" defaultValue={email} required />
        {state?.errors?.email && <p className="text-xs text-destructive">{state.errors.email[0]}</p>}
      </div>

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
      {state?.success && <p className="text-sm text-green-600">Conta atualizada!</p>}

      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Salvando..." : "Salvar dados da conta"}
      </Button>
    </form>
  );
}
