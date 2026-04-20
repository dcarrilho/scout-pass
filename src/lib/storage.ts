import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `avatars/${userId}.${ext}`;

  const { error } = await supabase.storage
    .from("scoutpass")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("scoutpass").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
