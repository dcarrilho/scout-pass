"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/actions/profile";
import { DarkInput, DarkField, DarkSubmit, FormError } from "@/components/ui/dark-form";

export default function AccountForm() {
  const [pwState, pwAction, pwPending] = useActionState(changePassword, undefined);

  return (
    <form action={pwAction} className="space-y-4">
      <DarkField label="Senha atual" error={pwState?.errors?.current_password?.[0]}>
        <DarkInput id="current_password" name="current_password" type="password" autoComplete="current-password" />
      </DarkField>

      <DarkField label="Nova senha" error={pwState?.errors?.new_password?.[0]}>
        <DarkInput id="new_password" name="new_password" type="password" autoComplete="new-password" />
      </DarkField>

      <DarkField label="Confirmar nova senha" error={pwState?.errors?.confirm_password?.[0]}>
        <DarkInput id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" />
      </DarkField>

      <FormError message={pwState?.message} />
      {pwState?.success && (
        <p className="text-sm font-medium" style={{ color: "#16a34a" }}>Senha alterada com sucesso!</p>
      )}

      <DarkSubmit pending={pwPending} label="Alterar senha" pendingLabel="Alterando..." />
    </form>
  );
}
