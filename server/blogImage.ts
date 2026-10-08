import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

const BUCKET = "blog-images";

const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export function isAllowedBlogImage(mimetype: string) {
  return Object.prototype.hasOwnProperty.call(MIME_EXT, mimetype);
}

function storageClient() {
  const url = (process.env.VITE_SUPABASE_URL || "").trim();
  const key = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) {
    throw new Error("Supabase is not configured, so the cover image could not be saved");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function saveBlogCover(slug: string, file: { buffer: Buffer; mimetype: string }) {
  const ext = MIME_EXT[file.mimetype];
  if (!ext) {
    throw new Error("Please upload a JPG, PNG, WEBP, or GIF image");
  }

  const safeSlug = slug.replace(/[^a-z0-9-]/g, "").slice(0, 80) || `post-${Date.now()}`;
  const objectPath = `covers/${safeSlug}/cover-${nanoid(8)}${ext}`;
  const supabase = storageClient();
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message || "Could not save the cover image");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  if (!data.publicUrl) {
    throw new Error("Could not create a public link for the cover image");
  }
  return data.publicUrl;
}
