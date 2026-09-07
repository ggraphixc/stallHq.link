import { supabase } from "./supabase";

const MAX_PHOTOS = 4;
const BUCKET = "review-photos";

/**
 * Pick up to (4 - existing) images from the gallery and upload them to
 * Supabase storage. Returns the public URLs.
 */
export async function pickAndUploadReviewPhotos(
  existing: string[] = []
): Promise<string[]> {
  const remaining = MAX_PHOTOS - existing.length;
  if (remaining <= 0) return [];

  let ImagePicker: typeof import("expo-image-picker") | null = null;
  try {
    ImagePicker = await import("expo-image-picker");
  } catch {
    return [];
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.length) return [];

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id || "anon";

  const urls: string[] = [];
  for (const asset of result.assets.slice(0, remaining)) {
    try {
      const ext = asset.fileName?.split(".").pop() || "jpg";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const res = await fetch(asset.uri);
      const blob = await res.blob();
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: asset.mimeType || "image/jpeg",
        upsert: false,
      });
      if (error) continue;
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(urlData.publicUrl);
    } catch {}
  }
  return urls;
}