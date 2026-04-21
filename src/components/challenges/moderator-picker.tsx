"use client";

import { useState, useTransition, useRef } from "react";
import { searchUsers, type UserOption } from "@/app/actions/users";
import { inputCls, inputStyle, inputFocusStyle } from "@/components/ui/dark-form";

type Props = {
  currentModerators?: { id: string; name: string; username: string }[];
};

export function ModeratorPicker({ currentModerators = [] }: Props) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserOption[]>([]);
  const [selected, setSelected] = useState<UserOption[]>(
    currentModerators.map((u) => ({ ...u, avatar_url: null }))
  );
  const [pending, startSearch] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    setSearch(value);
    setResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) return;
    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        const users = await searchUsers(value);
        setResults(users.filter((u) => !selected.some((s) => s.id === u.id)));
      });
    }, 250);
  }

  function handleSelect(user: UserOption) {
    setSelected((prev) => [...prev, user]);
    setSearch("");
    setResults([]);
  }

  function handleRemove(id: string) {
    setSelected((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="space-y-2">
      {selected.map((u) => (
        <input key={u.id} type="hidden" name="moderator_ids" value={u.id} />
      ))}

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por nome ou @usuário..."
          value={search}
          onChange={(e) => handleChange(e.target.value)}
          className={inputCls}
          style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = inputFocusStyle.borderColor; }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(255,255,255,0.1)";
            setTimeout(() => setResults([]), 150);
          }}
          autoComplete="off"
        />
        {pending && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">…</span>
        )}
        {results.length > 0 && (
          <div
            className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-xl"
            style={{ background: "#1e1a17", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {results.map((user) => (
              <button
                key={user.id}
                type="button"
                onMouseDown={() => handleSelect(user)}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                style={{ color: "rgba(255,255,255,0.8)" }}
              >
                <span>{user.name}</span>
                <span className="ml-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>@{user.username}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }}
            >
              {u.name}
              <button
                type="button"
                onClick={() => handleRemove(u.id)}
                className="hover:text-white transition-colors"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
