"use server";

import { prisma } from "@/lib/prisma";

export type UserOption = { id: string; name: string; username: string; avatar_url: string | null };

export async function searchUsers(query: string): Promise<UserOption[]> {
  if (!query || query.trim().length < 2) return [];
  return prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query.trim(), mode: "insensitive" } },
        { username: { contains: query.trim(), mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, username: true, avatar_url: true },
    orderBy: { name: "asc" },
    take: 8,
  });
}
