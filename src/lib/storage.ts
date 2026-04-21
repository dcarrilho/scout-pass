import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === "scoutpass");
  if (!exists) {
    await supabase.storage.createBucket("scoutpass", { public: true });
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  await ensureBucket();

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `avatars/${userId}.${ext}`;

  const { error } = await supabase.storage
    .from("scoutpass")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(`Storage: ${error.message}`);

  const { data } = supabase.storage.from("scoutpass").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function uploadCover(userId: string, file: File): Promise<string> {
  await ensureBucket();

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `covers/${userId}.${ext}`;

  const { error } = await supabase.storage
    .from("scoutpass")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(`Storage: ${error.message}`);

  const { data } = supabase.storage.from("scoutpass").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function uploadEntityCover(folder: string, id: string, file: File): Promise<string> {
  await ensureBucket();

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `covers/${folder}/${id}.${ext}`;

  const { error } = await supabase.storage
    .from("scoutpass")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(`Storage: ${error.message}`);

  const { data } = supabase.storage.from("scoutpass").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function uploadCheckInPhoto(userId: string, file: File): Promise<string> {
  await ensureBucket();

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `checkins/${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("scoutpass")
    .upload(path, file, { contentType: file.type });

  if (error) throw new Error(`Storage: ${error.message}`);

  const { data } = supabase.storage.from("scoutpass").getPublicUrl(path);
  return data.publicUrl;
}
