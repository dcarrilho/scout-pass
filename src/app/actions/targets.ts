"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyModerator } from "@/lib/dal";

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

export async function createTarget(
  challengeId: string,
  state: TargetState,
  formData: FormData
): Promise<TargetState> {
  await verifyModerator();

  const parsed = parseForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await prisma.challengeTarget.create({
    data: {
      challenge_id: challengeId,
      name: parsed.data.name,
      type: parsed.data.type,
      order: parsed.data.order,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
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

  await prisma.challengeTarget.update({
    where: { id: targetId },
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      order: parsed.data.order,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
    },
  });

  revalidatePath(`/desafios/${challengeId}`);
  redirect(`/desafios/${challengeId}`);
}

export async function deleteTarget(targetId: string, challengeId: string): Promise<void> {
  await verifyModerator();
  await prisma.challengeTarget.delete({ where: { id: targetId } });
  revalidatePath(`/desafios/${challengeId}`);
  redirect(`/desafios/${challengeId}`);
}
