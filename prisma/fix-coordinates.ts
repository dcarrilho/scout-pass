/**
 * Atualiza lat/lng de todos os ChallengeTargets sem coordenadas nos desafios Valente.
 * Estratégia:
 *   1. Busca IDs IBGE dos municípios por estado via v1/localidades (27 chamadas bulk)
 *   2. Faz match pelo nome do waypoint → IBGE code
 *   3. Busca centroide via v3/malhas/municipios/{id}/metadados com concorrência limitada
 *
 * Uso: npx tsx prisma/fix-coordinates.ts
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const UF_CODES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
];

type IbgeMunicipio = { id: number; nome: string };
type CentroidMap = Record<string, { lat: number; lng: number }>; // nome_lower → coords

async function fetchMunicipios(uf: string): Promise<IbgeMunicipio[]> {
  try {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchCentroid(ibgeId: number): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${ibgeId}/metadados`
    );
    if (!res.ok) return null;
    const data: { centroide: { latitude: number; longitude: number } }[] = await res.json();
    if (!data[0]?.centroide) return null;
    return { lat: data[0].centroide.latitude, lng: data[0].centroide.longitude };
  } catch {
    return null;
  }
}

async function pLimit<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = [];
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function main() {
  console.log("🗺️  Iniciando atualização de coordenadas...\n");

  // 1. Buscar todos os desafios com state_code
  const challenges = await prisma.challenge.findMany({
    where: { state_code: { not: null } },
    select: { id: true, name: true, state_code: true },
  });
  console.log(`${challenges.length} desafios encontrados.\n`);

  // 2. Buscar municípios de todos os estados em paralelo
  process.stdout.write("Carregando municípios do IBGE para todos os estados... ");
  const ufMunicipios = await Promise.all(
    UF_CODES.map(async (uf) => ({ uf, municipios: await fetchMunicipios(uf) }))
  );
  const byUf: Record<string, IbgeMunicipio[]> = {};
  for (const { uf, municipios } of ufMunicipios) byUf[uf] = municipios;
  console.log("OK\n");

  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const challenge of challenges) {
    const uf = challenge.state_code!;
    const municipios = byUf[uf] ?? [];

    // Monta mapa nome_lower → IBGE id
    const nameToId: Record<string, number> = {};
    for (const m of municipios) nameToId[m.nome.toLowerCase()] = m.id;

    // Buscar waypoints sem coordenadas
    const targets = await prisma.challengeTarget.findMany({
      where: { challenges: { some: { id: challenge.id } }, latitude: null },
      select: { id: true, name: true },
    });

    if (targets.length === 0) {
      console.log(`[${uf}] ${challenge.name}: todos já têm coordenadas.`);
      continue;
    }

    process.stdout.write(`[${uf}] ${challenge.name}: ${targets.length} waypoints → `);

    // Faz match nome → IBGE id, ignorando os sem match
    const matched = targets
      .map((t) => ({ target: t, ibgeId: nameToId[t.name.toLowerCase()] }))
      .filter((x) => x.ibgeId != null);

    totalSkipped += targets.length - matched.length;

    if (matched.length === 0) {
      console.log("0 matches.");
      continue;
    }

    // Busca centroides com concorrência de 30
    const centroidTasks = matched.map(({ target, ibgeId }) => async () => {
      const coords = await fetchCentroid(ibgeId);
      if (!coords) return null;
      await prisma.challengeTarget.update({
        where: { id: target.id },
        data: { latitude: coords.lat, longitude: coords.lng },
      });
      return coords;
    });

    const results = await pLimit(centroidTasks, 30);
    const updated = results.filter(Boolean).length;
    totalUpdated += updated;
    console.log(`${updated}/${matched.length} atualizados.`);
  }

  console.log(`\n✅ Concluído: ${totalUpdated} coordenadas adicionadas, ${totalSkipped} sem match de nome.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
