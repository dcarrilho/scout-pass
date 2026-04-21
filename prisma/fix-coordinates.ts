/**
 * Atualiza lat/lng de todos os ChallengeTargets do tipo CITY sem coordenadas.
 * Usa a API IBGE v3 malhas/metadados para centroides por estado (27 chamadas bulk).
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

const STATE_IBGE_IDS: Record<string, number> = {
  AC: 12, AL: 27, AP: 16, AM: 13, BA: 29, CE: 23, DF: 53, ES: 32,
  GO: 52, MA: 21, MT: 51, MS: 50, MG: 31, PA: 15, PB: 25, PR: 41,
  PE: 26, PI: 22, RJ: 33, RN: 24, RS: 43, RO: 11, RR: 14, SC: 42,
  SP: 35, SE: 28, TO: 17,
};

type CentroidMap = Record<string, { lat: number; lng: number }>;

async function fetchStateCentroids(ibgeId: number): Promise<CentroidMap> {
  const res = await fetch(
    `https://servicodados.ibge.gov.br/api/v3/malhas/estados/${ibgeId}/municipios/metadados`
  );
  if (!res.ok) {
    console.warn(`  ⚠️  IBGE API retornou ${res.status} para estado ${ibgeId}`);
    return {};
  }
  const data: { codarea: string; centroide: { coordinates: [number, number] } }[] = await res.json();
  return Object.fromEntries(
    data.map((m) => [m.codarea, { lng: m.centroide.coordinates[0], lat: m.centroide.coordinates[1] }])
  );
}

async function fetchMunicipalityIds(uf: string): Promise<{ id: number; nome: string }[]> {
  const res = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
  );
  return res.json();
}

async function main() {
  console.log("🗺️  Iniciando atualização de coordenadas...\n");

  const challenges = await prisma.challenge.findMany({
    where: { state_code: { not: null } },
    select: { id: true, name: true, state_code: true },
  });

  console.log(`${challenges.length} desafios Valente encontrados.\n`);

  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const challenge of challenges) {
    const uf = challenge.state_code!;
    const ibgeId = STATE_IBGE_IDS[uf];
    if (!ibgeId) { console.warn(`UF desconhecida: ${uf}`); continue; }

    process.stdout.write(`[${uf}] Buscando centroides... `);

    const [municipios, centroids] = await Promise.all([
      fetchMunicipalityIds(uf),
      fetchStateCentroids(ibgeId),
    ]);

    // Monta mapa nome → coordenadas (fallback por nome quando IBGE ID não bate)
    const coordsByName: Record<string, { lat: number; lng: number }> = {};
    for (const m of municipios) {
      const c = centroids[String(m.id)];
      if (c) coordsByName[m.nome.toLowerCase()] = c;
    }

    const targets = await prisma.challengeTarget.findMany({
      where: { challenge_id: challenge.id, latitude: null },
      select: { id: true, name: true },
    });

    let updated = 0;
    for (const target of targets) {
      const coords = coordsByName[target.name.toLowerCase()];
      if (!coords) { totalSkipped++; continue; }

      await prisma.challengeTarget.update({
        where: { id: target.id },
        data: { latitude: coords.lat, longitude: coords.lng },
      });
      updated++;
      totalUpdated++;
    }

    console.log(`${updated}/${targets.length} atualizados.`);
  }

  console.log(`\n✅ Concluído: ${totalUpdated} coordenadas adicionadas, ${totalSkipped} sem match.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
