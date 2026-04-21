"use server";

import { prisma } from "@/lib/prisma";

export type CityOption = { id: string; name: string; ibge_code: string };

export async function getCitiesByState(uf: string): Promise<CityOption[]> {
  if (!uf) return [];
  return prisma.city.findMany({
    where: { state: uf },
    select: { id: true, name: true, ibge_code: true },
    orderBy: { name: "asc" },
  });
}
