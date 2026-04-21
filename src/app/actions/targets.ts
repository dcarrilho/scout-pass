"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyModerator, verifySession } from "@/lib/dal";
import type { MapPin } from "@/components/map/conquest-map";

const TargetSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  type: z.enum(["CITY", "WAYPOINT", "LANDMARK", "BORDER"]).default("CITY"),
  order: z.coerce.number().int().default(0),
  latitude: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(-90).max(90).optional()
  ),
  longitude: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(-180).max(180).optional()
  ),
});

type TargetState = { errors?: Record<string, string[]>; message?: string } | undefined;

function parseForm(formData: FormData) {
  return TargetSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type") || "CITY",
    order: formData.get("order") || 0,
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
  });
}

async function resolveCoords(
  cityId: string | null,
  lat: number | undefined,
  lng: number | undefined
): Promise<{ latitude: number | null; longitude: number | null }> {
  if (lat != null && lng != null) return { latitude: lat, longitude: lng };
  if (cityId) {
    const city = await prisma.city.findUnique({ where: { id: cityId }, select: { latitude: true, longitude: true } });
    if (city) return { latitude: city.latitude, longitude: city.longitude };
  }
  return { latitude: null, longitude: null };
}

export async function createTarget(
  challengeId: string,
  state: TargetState,
  formData: FormData
): Promise<TargetState> {
  await verifyModerator();

  const parsed = parseForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const cityId = (formData.get("city_id") as string) || null;
  const coords = await resolveCoords(cityId, parsed.data.latitude, parsed.data.longitude);

  await prisma.challengeTarget.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      order: parsed.data.order,
      latitude: coords.latitude,
      longitude: coords.longitude,
      city_id: cityId,
      challenges: { connect: { id: challengeId } },
    },
  });

  revalidatePath(`/desafios/${challengeId}`);
  redirect(`/desafios/${challengeId}`);
}

export async function updateTarget(
  targetId: string,
  challengeId: string,
  state: TargetState,
  formData: FormData
): Promise<TargetState> {
  await verifyModerator();

  const parsed = parseForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const cityId = (formData.get("city_id") as string) || null;
  const coords = await resolveCoords(cityId, parsed.data.latitude, parsed.data.longitude);

  await prisma.challengeTarget.update({
    where: { id: targetId },
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      order: parsed.data.order,
      latitude: coords.latitude,
      longitude: coords.longitude,
      city_id: cityId,
    },
  });

  revalidatePath(`/desafios/${challengeId}`);
  redirect(`/desafios/${challengeId}`);
}

// Remove target from a challenge (unlink). Deletes entirely if no other challenges use it.
export async function unlinkTarget(targetId: string, challengeId: string): Promise<void> {
  await verifyModerator();

  await prisma.challengeTarget.update({
    where: { id: targetId },
    data: { challenges: { disconnect: { id: challengeId } } },
  });

  // Clean up orphaned targets
  const target = await prisma.challengeTarget.findUnique({
    where: { id: targetId },
    select: { _count: { select: { challenges: true } } },
  });
  if (target?._count.challenges === 0) {
    await prisma.challengeTarget.delete({ where: { id: targetId } });
  }

  revalidatePath(`/desafios/${challengeId}`);
  redirect(`/desafios/${challengeId}`);
}

// Link an existing target to a challenge
export async function linkTargetToChallenge(
  targetId: string,
  challengeId: string,
  state: TargetState,
  _formData: FormData
): Promise<TargetState> {
  await verifyModerator();

  const target = await prisma.challengeTarget.findUnique({ where: { id: targetId } });
  if (!target) return { message: "Waypoint não encontrado." };

  await prisma.challengeTarget.update({
    where: { id: targetId },
    data: { challenges: { connect: { id: challengeId } } },
  });

  revalidatePath(`/desafios/${challengeId}`);
  redirect(`/desafios/${challengeId}`);
}

// ─── Locais próximos ──────────────────────────────────────────────────────────

export type NearbyPin = MapPin & { distanceKm: number };

type RawNearby = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  challenge_id: string;
  challengeName: string;
  distance: number;
};

export async function findNearbyTargets(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<NearbyPin[]> {
  const session = await verifySession();

  const nearby = await prisma.$queryRaw<RawNearby[]>`
    SELECT DISTINCT ON (ct.id)
      ct.id,
      ct.name,
      ct.latitude,
      ct.longitude,
      c.id AS challenge_id,
      c.name AS "challengeName",
      (6371 * acos(LEAST(1.0,
        cos(radians(${lat})) * cos(radians(ct.latitude)) *
        cos(radians(ct.longitude) - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(ct.latitude))
      ))) AS distance
    FROM "ChallengeTarget" ct
    JOIN "_ChallengeTargets" ct_link ON ct_link."B" = ct.id
    JOIN "Challenge" c ON c.id = ct_link."A"
    WHERE ct.latitude IS NOT NULL AND ct.longitude IS NOT NULL
      AND (6371 * acos(LEAST(1.0,
        cos(radians(${lat})) * cos(radians(ct.latitude)) *
        cos(radians(ct.longitude) - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(ct.latitude))
      ))) <= ${radiusKm}
    ORDER BY ct.id, distance ASC
    LIMIT 100
  `;

  if (nearby.length === 0) return [];

  const targetIds = nearby.map((t) => t.id);
  const checkIns = await prisma.checkIn.findMany({
    where: { user_id: session.userId, target_id: { in: targetIds } },
    select: { target_id: true, status: true },
  });

  const checkInMap = new Map<string, string>();
  for (const c of checkIns) {
    if (!checkInMap.has(c.target_id) || c.status === "APPROVED") {
      checkInMap.set(c.target_id, c.status);
    }
  }

  return nearby
    .sort((a, b) => a.distance - b.distance)
    .map((t) => {
      const s = checkInMap.get(t.id);
      return {
        id: t.id,
        name: t.name,
        challengeName: t.challengeName,
        lat: t.latitude,
        lng: t.longitude,
        status: (s === "APPROVED" ? "approved" : s === "PENDING" ? "pending" : "none") as MapPin["status"],
        distanceKm: Math.round(t.distance * 10) / 10,
      };
    });
}
