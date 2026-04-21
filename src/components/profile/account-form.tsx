"use client";

import { useActionState } from "react";
import { updateAccount } from "@/app/actions/profile";
import { DarkInput, DarkField, DarkSubmit, FormError } from "@/components/ui/dark-form";

type Props = { username: string; email: string };

export default function AccountForm({ username, email }: Props) {
  const [state, action, pending] = useActionState(updateAccount, undefined);

  return (
    <form action={action} className="space-y-5">
      <DarkField label="Usuário" hint="Apenas letras minúsculas, números e _" error={state?.errors?.username?.[0]}>
        <DarkInput id="username" name="username" defaultValue={username} required />
      </DarkField>

      <DarkField label="E-mail" error={state?.errors?.email?.[0]}>
        <DarkInput id="email" name="email" type="email" defaultValue={email} required />
      </DarkField>

      <FormError message={state?.message} />
      {state?.success && (
        <p className="text-sm font-medium" style={{ color: "#16a34a" }}>Conta atualizada!</p>
      )}

      <DarkSubmit pending={pending} label="Salvar dados da conta" pendingLabel="Salvando..." />
    </form>
  );
}
