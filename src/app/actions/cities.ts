"use server";

import { prisma } from "@/lib/prisma";

export type CityOption = { id: string; name: string; state: string };

export async function searchCities(query: string): Promise<CityOption[]> {
  if (!query || query.trim().length < 2) return [];
  return prisma.city.findMany({
    where: { name: { contains: query.trim(), mode: "insensitive" } },
    select: { id: true, name: true, state: true },
    orderBy: { name: "asc" },
    take: 10,
  });
}
