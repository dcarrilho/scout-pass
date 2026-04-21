"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { updateAccount, changePassword } from "@/app/actions/profile";
import { DarkInput, DarkField, DarkSubmit, FormError } from "@/components/ui/dark-form";

type Props = { username: string; email: string };

export default function AccountForm({ username, email }: Props) {
  const router = useRouter();
  const [accountState, accountAction, accountPending] = useActionState(updateAccount, undefined);
  const [pwState, pwAction, pwPending] = useActionState(changePassword, undefined);

  useEffect(() => {
    if (accountState?.success && accountState.newUsername) {
      router.push(`/perfil/${accountState.newUsername}`);
    }
  }, [accountState?.success, accountState?.newUsername, router]);

  return (
    <div className="space-y-6">
      {/* Dados da conta */}
      <form action={accountAction} className="space-y-5">
        <DarkField label="Usuário" hint="Apenas letras minúsculas, números e _" error={accountState?.errors?.username?.[0]}>
          <DarkInput id="username" name="username" defaultValue={username} required />
        </DarkField>

        {/* Aviso de mudança de username */}
        <div className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
          <AlertTriangle className="size-4 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-xs" style={{ color: "rgba(249,115,22,0.85)" }}>
            Alterar o usuário quebra links já compartilhados do seu perfil.
          </p>
        </div>

        <DarkField label="E-mail" error={accountState?.errors?.email?.[0]}>
          <DarkInput id="email" name="email" type="email" defaultValue={email} required />
        </DarkField>

        <FormError message={accountState?.message} />
        {accountState?.success && (
          <p className="text-sm font-medium" style={{ color: "#16a34a" }}>Conta atualizada!</p>
        )}

        <DarkSubmit pending={accountPending} label="Salvar dados da conta" pendingLabel="Salvando..." />
      </form>

      {/* Separador */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

      {/* Trocar senha */}
      <form action={pwAction} className="space-y-4">
        <p className="text-sm font-semibold text-white/60 uppercase tracking-wider">Trocar senha</p>

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
    </div>
  );
}
