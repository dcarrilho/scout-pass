"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyModerator } from "@/lib/dal";
import { uploadEntityCover } from "@/lib/storage";

async function extractCover(folder: string, id: string, formData: FormData): Promise<string | undefined> {
  const file = formData.get("cover") as File | null;
  if (!file || file.size === 0) return undefined;
  return uploadEntityCover(folder, id, file);
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string) {
  let slug = slugify(base);
  let n = 0;
  while (await prisma.organizer.findUnique({ where: { slug } })) {
    slug = `${slugify(base)}-${++n}`;
  }
  return slug;
}

// ─── Organizer ────────────────────────────────────────────────────────────────

const OrganizerSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  description: z.string().optional(),
});

type OrgState = { errors?: Record<string, string[]>; message?: string } | undefined;

export async function createOrganizer(state: OrgState, formData: FormData): Promise<OrgState> {
  await verifyModerator();

  const parsed = OrganizerSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const slug = await uniqueSlug(parsed.data.name);
  const org = await prisma.organizer.create({
    data: { name: parsed.data.name, slug, description: parsed.data.description },
  });

  const cover_url = await extractCover("organizers", org.id, formData);
  if (cover_url) await prisma.organizer.update({ where: { id: org.id }, data: { cover_url } });

  revalidatePath("/desafios");
  redirect("/desafios");
}

// ─── Series ───────────────────────────────────────────────────────────────────

const SeriesSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  organizer_id: z.string().optional(),
});

type SeriesState = { errors?: Record<string, string[]>; message?: string } | undefined;

export async function createSeries(state: SeriesState, formData: FormData): Promise<SeriesState> {
  await verifyModerator();

  const parsed = SeriesSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    icon: formData.get("icon") || undefined,
    color: formData.get("color") || undefined,
    organizer_id: formData.get("organizer_id") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const series = await prisma.series.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      icon: parsed.data.icon,
      color: parsed.data.color,
      organizer_id: parsed.data.organizer_id ?? null,
    },
    include: { organizer: { select: { slug: true } } },
  });

  const cover_url = await extractCover("series", series.id, formData);
  if (cover_url) await prisma.series.update({ where: { id: series.id }, data: { cover_url } });

  if (series.organizer) {
    revalidatePath(`/desafios/org/${series.organizer.slug}`);
    redirect(`/desafios/org/${series.organizer.slug}`);
  }
  revalidatePath("/desafios");
  redirect("/desafios");
}

export async function linkSeriesToOrg(seriesId: string, orgSlug: string) {
  await verifyModerator();
  const org = await prisma.organizer.findUnique({ where: { slug: orgSlug } });
  if (!org) return;
  await prisma.series.update({ where: { id: seriesId }, data: { organizer_id: org.id } });
  revalidatePath(`/desafios/org/${orgSlug}`);
  redirect(`/desafios/org/${orgSlug}`);
}

// ─── Challenge ────────────────────────────────────────────────────────────────

const ChallengeSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  description: z.string().optional(),
  state_code: z.string().optional(),
  series_id: z.string().optional(),
});

type ChallengeState = { errors?: Record<string, string[]>; message?: string } | undefined;

export async function createChallenge(
  state: ChallengeState,
  formData: FormData
): Promise<ChallengeState> {
  await verifyModerator();

  const parsed = ChallengeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    state_code: formData.get("state_code") || undefined,
    series_id: formData.get("series_id") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const seriesId = parsed.data.series_id;

  let organizer_id: string | null = null;
  if (seriesId) {
    const series = await prisma.series.findUnique({ where: { id: seriesId }, select: { organizer_id: true } });
    organizer_id = series?.organizer_id ?? null;
  }

  const challenge = await prisma.challenge.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      state_code: parsed.data.state_code,
      series_id: seriesId ?? null,
      organizer_id,
    },
  });

  const cover_url = await extractCover("challenges", challenge.id, formData);
  if (cover_url) await prisma.challenge.update({ where: { id: challenge.id }, data: { cover_url } });

  if (seriesId) {
    revalidatePath(`/desafios/serie/${seriesId}`);
    redirect(`/desafios/serie/${seriesId}`);
  }
  revalidatePath("/desafios");
  redirect("/desafios");
}

export async function linkChallengeToSeries(challengeId: string, seriesId: string) {
  await verifyModerator();
  await prisma.challenge.update({ where: { id: challengeId }, data: { series_id: seriesId } });
  revalidatePath(`/desafios/serie/${seriesId}`);
  redirect(`/desafios/serie/${seriesId}`);
}

// ─── Update Organizer ─────────────────────────────────────────────────────────

export async function updateOrganizer(
  slug: string,
  state: OrgState,
  formData: FormData
): Promise<OrgState> {
  await verifyModerator();

  const parsed = OrganizerSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const org = await prisma.organizer.update({
    where: { slug },
    data: { name: parsed.data.name, description: parsed.data.description ?? null },
    select: { id: true },
  });

  const cover_url = await extractCover("organizers", org.id, formData);
  if (cover_url) await prisma.organizer.update({ where: { id: org.id }, data: { cover_url } });

  revalidatePath(`/desafios/org/${slug}`);
  revalidatePath("/desafios");
  redirect(`/desafios/org/${slug}`);
}

// ─── Update Series ────────────────────────────────────────────────────────────

export async function updateSeries(
  id: string,
  state: SeriesState,
  formData: FormData
): Promise<SeriesState> {
  await verifyModerator();

  const parsed = SeriesSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    icon: formData.get("icon") || undefined,
    color: formData.get("color") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const series = await prisma.series.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      icon: parsed.data.icon ?? null,
      color: parsed.data.color ?? null,
    },
    include: { organizer: { select: { slug: true } } },
  });

  const cover_url = await extractCover("series", id, formData);
  if (cover_url) await prisma.series.update({ where: { id }, data: { cover_url } });

  revalidatePath(`/desafios/serie/${id}`);
  if (series.organizer) revalidatePath(`/desafios/org/${series.organizer.slug}`);
  redirect(`/desafios/serie/${id}`);
}

// ─── Update Challenge ─────────────────────────────────────────────────────────

export async function updateChallenge(
  id: string,
  state: ChallengeState,
  formData: FormData
): Promise<ChallengeState> {
  await verifyModerator();

  const parsed = ChallengeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    state_code: formData.get("state_code") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await prisma.challenge.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      state_code: parsed.data.state_code ?? null,
    },
  });

  const cover_url = await extractCover("challenges", id, formData);
  if (cover_url) await prisma.challenge.update({ where: { id }, data: { cover_url } });

  revalidatePath(`/desafios/${id}`);
  redirect(`/desafios/${id}`);
}

// ─── Org Standalone Challenge ─────────────────────────────────────────────────

export async function createOrgChallenge(
  orgSlug: string,
  state: ChallengeState,
  formData: FormData
): Promise<ChallengeState> {
  await verifyModerator();

  const parsed = ChallengeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    state_code: formData.get("state_code") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const org = await prisma.organizer.findUnique({ where: { slug: orgSlug } });
  if (!org) return { message: "Organização não encontrada." };

  const challenge = await prisma.challenge.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      state_code: parsed.data.state_code,
      organizer_id: org.id,
      series_id: null,
    },
  });

  const cover_url = await extractCover("challenges", challenge.id, formData);
  if (cover_url) await prisma.challenge.update({ where: { id: challenge.id }, data: { cover_url } });

  revalidatePath(`/desafios/org/${orgSlug}`);
  redirect(`/desafios/org/${orgSlug}`);
}

export async function linkChallengeToOrg(challengeId: string, orgSlug: string) {
  await verifyModerator();
  const org = await prisma.organizer.findUnique({ where: { slug: orgSlug } });
  if (!org) return;
  await prisma.challenge.update({
    where: { id: challengeId },
    data: { organizer_id: org.id },
  });
  revalidatePath(`/desafios/org/${orgSlug}`);
  redirect(`/desafios/org/${orgSlug}`);
}
