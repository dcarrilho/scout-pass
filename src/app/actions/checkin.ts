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

async function uploadCheckInPhoto(checkInId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `checkins/${checkInId}.${ext}`;
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
  const photo = formData.get("photo") as File | null;

  if (!challengeId || !targetId) return { error: "Dados inválidos." };
  if (!photo || photo.size === 0) return { error: "A foto é obrigatória." };
  if (photo.size > 10 * 1024 * 1024) return { error: "Foto deve ter no máximo 10MB." };

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
    const photoUrl = await uploadCheckInPhoto(checkIn.id, photo);
    await prisma.checkIn.update({
      where: { id: checkIn.id },
      data: { photo_url: photoUrl },
    });
  } catch {
    await prisma.checkIn.delete({ where: { id: checkIn.id } });
    return { error: "Erro ao enviar foto. Tente novamente." };
  }

  revalidatePath(`/desafios/${challengeId}`);
  redirect(`/desafios/${challengeId}?enviado=1`);
}
