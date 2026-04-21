"use client";

import { useState, useTransition, useRef } from "react";
import { searchCities, type CityOption } from "@/app/actions/cities";
import { inputCls, inputStyle, inputFocusStyle } from "@/components/ui/dark-form";

type Props = {
  currentCityId?: string | null;
  currentCityName?: string | null;
  currentState?: string | null;
};

export function CityPicker({ currentCityId, currentCityName, currentState }: Props) {
  const initialLabel = currentCityName && currentState ? `${currentCityName} - ${currentState}` : "";

  const [search, setSearch] = useState(initialLabel);
  const [selectedId, setSelectedId] = useState(currentCityId ?? "");
  const [results, setResults] = useState<CityOption[]>([]);
  const [pending, startSearch] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    setSearch(value);
    setSelectedId("");
    setResults([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) return;

    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        const cities = await searchCities(value);
        setResults(cities);
      });
    }, 250);
  }

  function handleSelect(city: CityOption) {
    setSelectedId(city.id);
    setSearch(`${city.name} - ${city.state}`);
    setResults([]);
  }

  function handleClear() {
    setSelectedId("");
    setSearch("");
    setResults([]);
  }

  const showDropdown = results.length > 0 && !selectedId;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/75">Município</label>
      <input type="hidden" name="city_id" value={selectedId} />

      <div className="relative">
        <input
          type="text"
          placeholder="Ex: Cuiabá - MT"
          value={search}
          onChange={(e) => handleChange(e.target.value)}
          className={inputCls}
          style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = inputFocusStyle.borderColor; }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(255,255,255,0.1)";
            // pequeno delay para permitir o click no dropdown
            setTimeout(() => setResults([]), 150);
          }}
          autoComplete="off"
        />

        {(selectedId || search) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            ✕
          </button>
        )}

        {pending && (
          <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-white/30">…</span>
        )}

        {showDropdown && (
          <div
            className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-xl"
            style={{ background: "#1e1a17", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {results.map((city) => (
              <button
                key={city.id}
                type="button"
                onMouseDown={() => handleSelect(city)}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                style={{ color: "rgba(255,255,255,0.8)" }}
              >
                <span>{city.name}</span>
                <span className="ml-1.5 text-xs font-semibold" style={{ color: "#f97316" }}>{city.state}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedId && (
        <p className="text-xs" style={{ color: "rgba(249,115,22,0.8)" }}>✓ {search}</p>
      )}
    </div>
  );
}
