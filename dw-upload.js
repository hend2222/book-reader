/* ============================================================
   DreamWings — Supabase upload helper
   Keeps the existing `upload-book` edge function contract and adds the
   creator's Firebase ID token as the authorization bearer.
   ============================================================ */

import { auth, supabase } from "./firebase-config.js";
import { UPLOAD_FUNCTION } from "./dw-config.js";

export function safeFileName(name) {
  return String(name || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

export function isImage(file, maxMb = 8) {
  return !!file &&
    ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
    file.size <= maxMb * 1024 * 1024;
}

export function isAudio(file, maxMb = 50) {
  return !!file && file.type.startsWith("audio/") && file.size <= maxMb * 1024 * 1024;
}

export function isVideo(file, maxMb = 250) {
  return !!file && file.type.startsWith("video/") && file.size <= maxMb * 1024 * 1024;
}

export async function uploadFile(path, file) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in first.");

  const token = await user.getIdToken();
  const body = new FormData();
  body.append("file", file, file.name);
  body.append("path", path);

  const { data, error } = await supabase.functions.invoke(UPLOAD_FUNCTION, {
    body,
    headers: { Authorization: `Bearer ${token}` }
  });

  if (error) throw new Error(error.message || "Supabase upload failed.");
  if (!data?.success || !data?.url) throw new Error(data?.error || "Upload failed.");
  return data.url;
}
