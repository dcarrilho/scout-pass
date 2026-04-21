"use client";

import { useState, useTransition, useMemo } from "react";
import { getCitiesByState, type CityOption } from "@/app/actions/cities";
import { inputCls, inputStyle, inputFocusStyle } from "@/components/ui/dark-form";

const REGIONS: Record<string, string[]> = {
  "Norte": ["AC", "AM", "AP", "PA", "RO", "RR", "TO"],
  "Nordeste": ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  "Centro-Oeste": ["DF", "GO", "MS", "MT"],
  "Sudeste": ["ES", "MG", "RJ", "SP"],
  "Sul": ["PR", "RS", "SC"],
};

const STATE_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas",
  BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
  GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul",
  MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná",
  PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina",
  SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

const selectStyle = {
  ...inputStyle,
  colorScheme: "dark" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat" as const,
  backgroundPosition: "right 14px center" as const,
  paddingRight: "36px",
};

type Props = {
  currentCityId?: string | null;
  currentCityName?: string | null;
  currentState?: string | null;
  currentRegion?: string | null;
};

export function CityPicker({ currentCityId, currentCityName, currentState, currentRegion }: Props) {
  const initialRegion = currentRegion ?? (currentState ? Object.entries(REGIONS).find(([, ufs]) => ufs.includes(currentState!))?.[0] ?? "" : "");

  const [region, setRegion] = useState(initialRegion);
  const [uf, setUf] = useState(currentState ?? "");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [search, setSearch] = useState(currentCityName ?? "");
  const [selectedId, setSelectedId] = useState(currentCityId ?? "");
  const [loadPending, startLoad] = useTransition();

  const statesInRegion = region ? REGIONS[region] ?? [] : [];

  function handleRegionChange(r: string) {
    setRegion(r);
    setUf("");
    setCities([]);
    setSearch("");
    setSelectedId("");
  }

  function handleStateChange(newUf: string) {
    setUf(newUf);
    setSearch("");
    setSelectedId("");
    if (!newUf) { setCities([]); return; }
    startLoad(async () => {
      const result = await getCitiesByState(newUf);
      setCities(result);
    });
  }

  function handleCitySelect(city: CityOption) {
    setSelectedId(city.id);
    setSearch(city.name);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q || selectedId) return cities.slice(0, 8);
    return cities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [cities, search, selectedId]);

  const showDropdown = cities.length > 0 && search.length > 0 && !selectedId;

  return (
    <div className="space-y-3">
      {/* Hidden input for form submission */}
      <input type="hidden" name="city_id" value={selectedId} />

      {/* Region */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-white/75">Região</label>
        <select
          value={region}
          onChange={(e) => handleRegionChange(e.target.value)}
          className={inputCls + " appearance-none"}
          style={selectStyle}
          onFocus={(e) => { e.target.style.borderColor = inputFocusStyle.borderColor; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
        >
          <option value="">Selecione a região</option>
          {Object.keys(REGIONS).map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* State */}
      {region && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/75">Estado</label>
          <select
            value={uf}
            onChange={(e) => handleStateChange(e.target.value)}
            className={inputCls + " appearance-none"}
            style={selectStyle}
            onFocus={(e) => { e.target.style.borderColor = inputFocusStyle.borderColor; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            <option value="">Selecione o estado</option>
            {statesInRegion.map((s) => <option key={s} value={s}>{STATE_NAMES[s]} ({s})</option>)}
          </select>
        </div>
      )}

      {/* City search */}
      {uf && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/75">
            Município
            {loadPending && <span className="text-white/30 ml-2 text-xs">carregando…</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Digite para buscar…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedId(""); }}
              className={inputCls}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = inputFocusStyle.borderColor; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
              autoComplete="off"
            />
            {selectedId && (
              <button
                type="button"
                onClick={() => { setSelectedId(""); setSearch(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs"
              >
                ✕
              </button>
            )}
            {showDropdown && filtered.length > 0 && (
              <div
                className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-lg"
                style={{ background: "#1a1614", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                {filtered.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onMouseDown={() => handleCitySelect(city)}
                    className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedId && <p className="text-xs" style={{ color: "rgba(249,115,22,0.8)" }}>✓ {search}</p>}
        </div>
      )}
    </div>
  );
}
