"use client";

import { useTransition, useState } from "react";
import { updateUserRole } from "@/app/actions/admin";

const ROLES = [
  { value: "USER", label: "Usuário", color: "rgba(255,255,255,0.15)", text: "rgba(255,255,255,0.6)" },
  { value: "MODERATOR", label: "Moderador", color: "rgba(249,115,22,0.15)", text: "#f97316" },
  { value: "ADMIN", label: "Admin", color: "rgba(168,85,247,0.15)", text: "#a855f7" },
];

type Props = { userId: string; currentRole: string; isSelf: boolean };

export default function RoleSelector({ userId, currentRole, isSelf }: Props) {
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState(currentRole);
  const current = ROLES.find((r) => r.value === role) ?? ROLES[0];

  const handleChange = (next: string) => {
    if (next === role) return;
    const label = ROLES.find((r) => r.value === next)?.label ?? next;
    if (!confirm(`Alterar role para "${label}"?`)) return;
    setRole(next);
    startTransition(() => updateUserRole(userId, next));
  };

  if (isSelf) {
    return (
      <span
        className="text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: current.color, color: current.text }}
      >
        {current.label}
      </span>
    );
  }

  return (
    <select
      value={role}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value)}
      className="text-xs font-semibold rounded-full px-2.5 py-1 border-0 outline-none cursor-pointer transition-opacity disabled:opacity-50"
      style={{ background: current.color, color: current.text }}
    >
      {ROLES.map((r) => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </select>
  );
}
