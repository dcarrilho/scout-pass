"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export async function joinChallenge(challengeId: string) {
  const session = await verifySession();

  await prisma.challengeParticipant.upsert({
    where: { challenge_id_user_id: { challenge_id: challengeId, user_id: session.userId } },
    create: { challenge_id: challengeId, user_id: session.userId },
    update: {},
  });

  revalidatePath(`/desafios/${challengeId}`);
}

export async function leaveChallenge(challengeId: string) {
  const session = await verifySession();

  await prisma.challengeParticipant.deleteMany({
    where: { challenge_id: challengeId, user_id: session.userId },
  });

  revalidatePath(`/desafios/${challengeId}`);
}
