"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function uploadCheckInPhoto(checkInId: string, file: File, order: number): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `checkins/${checkInId}/${order}.${ext}`;
  const { error } = await supabase.storage
    .from("scoutpass")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("scoutpass").getPublicUrl(path);
  return data.publicUrl;
}

export async function submitCheckIn(
  _: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await verifySession();

  const challengeId = formData.get("challenge_id") as string;
  const targetId = formData.get("target_id") as string;
  const motorcycleId = formData.get("motorcycle_id") as string | null;
  const photoFiles = formData.getAll("photos") as File[];
  const validPhotos = photoFiles.filter((f) => f && f.size > 0);

  if (!challengeId || !targetId) return { error: "Dados inválidos." };
  if (validPhotos.length === 0) return { error: "Ao menos uma foto é obrigatória." };
  if (validPhotos.length > 5) return { error: "Máximo de 5 fotos permitidas." };
  for (const photo of validPhotos) {
    if (photo.size > 10 * 1024 * 1024) return { error: "Cada foto deve ter no máximo 10MB." };
  }

  const participant = await prisma.challengeParticipant.findUnique({
    where: { challenge_id_user_id: { challenge_id: challengeId, user_id: session.userId } },
  });
  if (!participant) return { error: "Você precisa participar do desafio antes de fazer check-in." };

  const alreadyApproved = await prisma.checkIn.findFirst({
    where: {
      user_id: session.userId,
      target_id: targetId,
      status: "APPROVED",
    },
  });
  if (alreadyApproved) return { error: "Você já conquistou este local." };

  const checkIn = await prisma.checkIn.create({
    data: {
      user_id: session.userId,
      challenge_id: challengeId,
      target_id: targetId,
      motorcycle_id: motorcycleId || null,
      photo_url: "",
      status: "PENDING",
    },
  });

  try {
    const urls: string[] = [];
    for (let i = 0; i < validPhotos.length; i++) {
      const url = await uploadCheckInPhoto(checkIn.id, validPhotos[i], i);
      urls.push(url);
    }

    await prisma.checkIn.update({
      where: { id: checkIn.id },
      data: { photo_url: urls[0] },
    });

    await prisma.checkInPhoto.createMany({
      data: urls.map((url, order) => ({ checkin_id: checkIn.id, url, order })),
    });
  } catch {
    await prisma.checkIn.delete({ where: { id: checkIn.id } });
    return { error: "Erro ao enviar fotos. Tente novamente." };
  }

  const challengeInfo = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { moderation_mode: true, moderators: { select: { user_id: true } } },
  });

  if (challengeInfo?.moderation_mode === "PRIVATE" && challengeInfo.moderators.length > 0) {
    await prisma.notification.createMany({
      data: challengeInfo.moderators.map((m) => ({
        user_id: m.user_id,
        actor_id: session.userId,
        type: "CHECKIN_PENDING_REVIEW" as const,
        checkin_id: checkIn.id,
      })),
      skipDuplicates: true,
    });
  }

  revalidatePath(`/desafios/${challengeId}`);
  redirect(`/desafios/${challengeId}?enviado=1`);
}
