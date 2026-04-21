/**
 * Popula a tabela City com todos os municípios brasileiros via IBGE.
 * Uso: npx tsx prisma/seed-cities.ts
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const STATES: { uf: string; region: string }[] = [
  { uf: "AC", region: "Norte" }, { uf: "AM", region: "Norte" },
  { uf: "AP", region: "Norte" }, { uf: "PA", region: "Norte" },
  { uf: "RO", region: "Norte" }, { uf: "RR", region: "Norte" },
  { uf: "TO", region: "Norte" },
  { uf: "AL", region: "Nordeste" }, { uf: "BA", region: "Nordeste" },
  { uf: "CE", region: "Nordeste" }, { uf: "MA", region: "Nordeste" },
  { uf: "PB", region: "Nordeste" }, { uf: "PE", region: "Nordeste" },
  { uf: "PI", region: "Nordeste" }, { uf: "RN", region: "Nordeste" },
  { uf: "SE", region: "Nordeste" },
  { uf: "DF", region: "Centro-Oeste" }, { uf: "GO", region: "Centro-Oeste" },
  { uf: "MS", region: "Centro-Oeste" }, { uf: "MT", region: "Centro-Oeste" },
  { uf: "ES", region: "Sudeste" }, { uf: "MG", region: "Sudeste" },
  { uf: "RJ", region: "Sudeste" }, { uf: "SP", region: "Sudeste" },
  { uf: "PR", region: "Sul" }, { uf: "RS", region: "Sul" },
  { uf: "SC", region: "Sul" },
];

async function fetchMunicipios(uf: string): Promise<{ id: number; nome: string }[]> {
  const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
  return res.json();
}

async function fetchCentroid(ibgeId: number): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${ibgeId}/metadados`);
    if (!res.ok) return null;
    const data: { centroide: { latitude: number; longitude: number } }[] = await res.json();
    if (!data[0]?.centroide) return null;
    return { lat: data[0].centroide.latitude, lng: data[0].centroide.longitude };
  } catch { return null; }
}

async function pLimit<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = [];
  let i = 0;
  async function worker() {
    while (i < tasks.length) { const idx = i++; results[idx] = await tasks[idx](); }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function main() {
  console.log("🏙️  Populando tabela City...\n");

  const existing = await prisma.city.count();
  if (existing > 0) {
    console.log(`Já existem ${existing} cidades. Pulando.`);
    return;
  }

  let total = 0;

  for (const { uf, region } of STATES) {
    process.stdout.write(`[${uf}] Buscando municípios... `);
    const municipios = await fetchMunicipios(uf);

    const tasks = municipios.map((m) => async () => {
      const coords = await fetchCentroid(m.id);
      return prisma.city.create({
        data: {
          ibge_code: String(m.id),
          name: m.nome,
          state: uf,
          region,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
        },
      });
    });

    await pLimit(tasks, 25);
    total += municipios.length;
    console.log(`${municipios.length} inseridos.`);
  }

  console.log(`\n✅ ${total} cidades inseridas.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
