import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const STATES = [
  { uf: "AC", ibgeId: 12, name: "Valente AC" }, { uf: "AL", ibgeId: 27, name: "Valente AL" },
  { uf: "AP", ibgeId: 16, name: "Valente AP" }, { uf: "AM", ibgeId: 13, name: "Valente AM" },
  { uf: "BA", ibgeId: 29, name: "Valente BA" }, { uf: "CE", ibgeId: 23, name: "Valente CE" },
  { uf: "DF", ibgeId: 53, name: "Valente DF" }, { uf: "ES", ibgeId: 32, name: "Valente ES" },
  { uf: "GO", ibgeId: 52, name: "Valente GO" }, { uf: "MA", ibgeId: 21, name: "Valente MA" },
  { uf: "MT", ibgeId: 51, name: "Valente MT" }, { uf: "MS", ibgeId: 50, name: "Valente MS" },
  { uf: "MG", ibgeId: 31, name: "Valente MG" }, { uf: "PA", ibgeId: 15, name: "Valente PA" },
  { uf: "PB", ibgeId: 25, name: "Valente PB" }, { uf: "PR", ibgeId: 41, name: "Valente PR" },
  { uf: "PE", ibgeId: 26, name: "Valente PE" }, { uf: "PI", ibgeId: 22, name: "Valente PI" },
  { uf: "RJ", ibgeId: 33, name: "Valente RJ" }, { uf: "RN", ibgeId: 24, name: "Valente RN" },
  { uf: "RS", ibgeId: 43, name: "Valente RS" }, { uf: "RO", ibgeId: 11, name: "Valente RO" },
  { uf: "RR", ibgeId: 14, name: "Valente RR" }, { uf: "SC", ibgeId: 42, name: "Valente SC" },
  { uf: "SP", ibgeId: 35, name: "Valente SP" }, { uf: "SE", ibgeId: 28, name: "Valente SE" },
  { uf: "TO", ibgeId: 17, name: "Valente TO" },
];

type CentroidMap = Record<string, { lat: number; lng: number }>;

async function fetchStateCentroids(ibgeId: number): Promise<CentroidMap> {
  try {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v3/malhas/estados/${ibgeId}/municipios/metadados`
    );
    if (!res.ok) return {};
    const data: { codarea: string; centroide: { coordinates: [number, number] } }[] = await res.json();
    return Object.fromEntries(
      data.map((m) => [m.codarea, { lng: m.centroide.coordinates[0], lat: m.centroide.coordinates[1] }])
    );
  } catch {
    return {};
  }
}

const CAPITALS = [
  { name: "Rio Branco", lat: -9.975, lng: -67.824 },
  { name: "Maceió", lat: -9.665, lng: -35.735 },
  { name: "Macapá", lat: 0.035, lng: -51.066 },
  { name: "Manaus", lat: -3.119, lng: -60.022 },
  { name: "Salvador", lat: -12.977, lng: -38.501 },
  { name: "Fortaleza", lat: -3.718, lng: -38.543 },
  { name: "Brasília", lat: -15.780, lng: -47.929 },
  { name: "Vitória", lat: -20.315, lng: -40.312 },
  { name: "Goiânia", lat: -16.686, lng: -49.264 },
  { name: "São Luís", lat: -2.529, lng: -44.303 },
  { name: "Cuiabá", lat: -15.601, lng: -56.097 },
  { name: "Campo Grande", lat: -20.469, lng: -54.620 },
  { name: "Belo Horizonte", lat: -19.912, lng: -43.940 },
  { name: "Belém", lat: -1.455, lng: -48.490 },
  { name: "João Pessoa", lat: -7.115, lng: -34.863 },
  { name: "Curitiba", lat: -25.428, lng: -49.273 },
  { name: "Recife", lat: -8.047, lng: -34.877 },
  { name: "Teresina", lat: -5.089, lng: -42.801 },
  { name: "Rio de Janeiro", lat: -22.906, lng: -43.172 },
  { name: "Natal", lat: -5.794, lng: -35.211 },
  { name: "Porto Alegre", lat: -30.033, lng: -51.230 },
  { name: "Porto Velho", lat: -8.761, lng: -63.900 },
  { name: "Boa Vista", lat: 2.825, lng: -60.674 },
  { name: "Florianópolis", lat: -27.595, lng: -48.548 },
  { name: "São Paulo", lat: -23.550, lng: -46.633 },
  { name: "Aracaju", lat: -10.909, lng: -37.071 },
  { name: "Palmas", lat: -10.168, lng: -48.330 },
];

const EXTREMES = [
  { name: "Nascente do Rio Ailã — Extremo Norte", lat: 5.271, lng: -60.209, order: 1 },
  { name: "Arroio Chuí — Extremo Sul", lat: -33.751, lng: -53.397, order: 2 },
  { name: "Ponta do Seixas — Extremo Leste", lat: -7.155, lng: -34.793, order: 3 },
  { name: "Nascente do Rio Moa — Extremo Oeste", lat: -7.531, lng: -73.989, order: 4 },
];

async function getOrCreateSeries(name: string, icon: string, color: string, order: number) {
  const existing = await prisma.series.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.series.create({ data: { name, icon, color, order } });
}

async function seedBandeirante() {
  const series = await getOrCreateSeries("Bandeirante", "🏛️", "amber", 2);

  const existing = await prisma.challenge.findFirst({
    where: { series_id: series.id, name: "Bandeirante" },
  });
  if (existing) { console.log("Bandeirante já existe, pulando..."); return; }

  const challenge = await prisma.challenge.create({
    data: {
      series_id: series.id,
      name: "Bandeirante",
      description: "Visite as 27 capitais do Brasil.",
    },
  });

  for (const capital of CAPITALS) {
    await prisma.challengeTarget.create({
      data: {
        challenges: { connect: { id: challenge.id } },
        name: capital.name,
        latitude: capital.lat,
        longitude: capital.lng,
        type: "CITY",
      },
    });
  }
  console.log(`Bandeirante criado com ${CAPITALS.length} capitais.`);
}

async function seedCardeal() {
  const series = await getOrCreateSeries("Cardeal", "🧭", "purple", 3);

  const existing = await prisma.challenge.findFirst({
    where: { series_id: series.id, name: "Cardeal" },
  });
  if (existing) { console.log("Cardeal já existe, pulando..."); return; }

  const challenge = await prisma.challenge.create({
    data: {
      series_id: series.id,
      name: "Cardeal",
      description: "Alcance os 4 extremos geográficos do Brasil.",
    },
  });

  for (const extreme of EXTREMES) {
    await prisma.challengeTarget.create({
      data: {
        challenges: { connect: { id: challenge.id } },
        name: extreme.name,
        latitude: extreme.lat,
        longitude: extreme.lng,
        order: extreme.order,
        type: "BORDER",
      },
    });
  }
  console.log("Cardeal criado com 4 extremos.");
}

async function seedValente() {
  const series = await getOrCreateSeries("Valente", "🏙️", "blue", 1);

  for (const state of STATES) {
    const existing = await prisma.challenge.findFirst({
      where: { series_id: series.id, state_code: state.uf },
    });
    if (existing) { console.log(`${state.name} já existe, pulando...`); continue; }

    const [municipiosRes, centroids] = await Promise.all([
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state.uf}/municipios`),
      fetchStateCentroids(state.ibgeId),
    ]);
    const municipios: { id: number; nome: string }[] = await municipiosRes.json();

    const challenge = await prisma.challenge.create({
      data: {
        series_id: series.id,
        name: state.name,
        state_code: state.uf,
        description: `Visite todos os municípios do estado.`,
      },
    });

    for (const municipio of municipios) {
      const coords = centroids[String(municipio.id)];
      await prisma.challengeTarget.create({
        data: {
          challenges: { connect: { id: challenge.id } },
          name: municipio.nome,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
          type: "CITY",
        },
      });
    }
    const withCoords = Object.keys(centroids).length;
    console.log(`${state.name} criado com ${municipios.length} municípios (${withCoords} com coordenadas).`);
  }
}

async function main() {
  console.log("Iniciando seed...");
  await seedBandeirante();
  await seedCardeal();
  await seedValente();
  console.log("Seed concluído!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
