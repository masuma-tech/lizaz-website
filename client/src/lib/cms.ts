import type { BlogPost, Contact } from "@shared/schema";
import { requireSupabase } from "@/lib/supabase";

export type CmsUser = {
  id: string;
  username: string;
  name: string | null;
  isAdmin: boolean;
  canManageBlogs: boolean;
  canViewLeads: boolean;
};

type BlogInput = {
  title: string;
  slug: string;
  category: string;
  author: string;
  date: string;
  image: string;
  excerpt: string;
  content: string;
  published: boolean;
};

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function supabase() {
  return requireSupabase();
}

function mapBlog(row: Record<string, unknown>): BlogPost {
  return {
    id: String(row.id),
    title: String(row.title || ""),
    slug: String(row.slug || ""),
    excerpt: String(row.excerpt || ""),
    content: String(row.content || ""),
    category: String(row.category || ""),
    author: String(row.author || ""),
    date: String(row.date || ""),
    image: String(row.image || ""),
    published: Boolean(row.published),
    createdAt: new Date(String(row.created_at || "")),
    updatedAt: new Date(String(row.updated_at || "")),
  };
}

function mapContact(row: Record<string, unknown>): Contact {
  return {
    id: String(row.id),
    firstName: String(row.first_name || ""),
    lastName: String(row.last_name || ""),
    email: String(row.email || ""),
    phone: row.phone == null ? null : String(row.phone),
    service: row.service == null ? null : String(row.service),
    subject: row.subject == null ? null : String(row.subject),
    message: String(row.message || ""),
    notes: row.notes == null ? null : String(row.notes),
    createdAt: new Date(String(row.created_at || "")),
  };
}

function mapUser(row: Record<string, unknown>): CmsUser {
  return {
    id: String(row.id),
    username: String(row.username || ""),
    name: row.name == null ? null : String(row.name),
    isAdmin: Boolean(row.is_admin),
    canManageBlogs: Boolean(row.can_manage_blogs),
    canViewLeads: Boolean(row.can_view_leads),
  };
}

async function fetchProfile(): Promise<CmsUser | null> {
  const { data: authData, error: authError } = await supabase().auth.getUser();
  if (authError || !authData.user?.email) return null;

  const { data, error } = await supabase()
    .from("users")
    .select("id, username, name, is_admin, can_manage_blogs, can_view_leads")
    .ilike("email", authData.user.email)
    .maybeSingle();
  if (error || !data) return null;
  return mapUser(data);
}

export async function loginCms(username: string, password: string): Promise<CmsUser> {
  const trimmed = username.trim();
  let email = trimmed.includes("@") ? trimmed.toLowerCase() : "";

  if (!email) {
    const { data, error } = await supabase().rpc("resolve_login_email", { identifier: trimmed });
    if (error || !data) throw new Error("Invalid username or password");
    email = String(data).trim();
  }

  if (!email) throw new Error("Invalid username or password");

  const { error } = await supabase().auth.signInWithPassword({ email, password });
  if (error) throw new Error("Invalid username or password");

  const profile = await fetchProfile();
  const allowed = Boolean(profile && (profile.isAdmin || profile.canManageBlogs || profile.canViewLeads));
  if (!profile || !allowed) {
    await supabase().auth.signOut();
    throw new Error("Invalid username or password");
  }
  return profile;
}

export async function logoutCms() {
  const { error } = await supabase().auth.signOut();
  if (error) throw new Error(error.message);
}

export async function currentCmsUser(): Promise<CmsUser | null> {
  const { data } = await supabase().auth.getSession();
  if (!data.session) return null;
  const profile = await fetchProfile();
  if (!profile || !(profile.isAdmin || profile.canManageBlogs || profile.canViewLeads)) {
    await supabase().auth.signOut();
    return null;
  }
  return profile;
}

export async function fetchCmsBlogs(): Promise<BlogPost[]> {
  const { data, error } = await supabase()
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((row) => mapBlog(row));
}

export async function fetchCmsContacts(): Promise<Contact[]> {
  const { data, error } = await supabase()
    .from("contacts")
    .select("id, first_name, last_name, email, phone, service, subject, message, notes, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((row) => mapContact(row));
}

async function uniqueSlug(baseSlug: string, excludeId: string | null) {
  let slug = baseSlug || `post-${Date.now()}`;
  let attempt = 1;
  while (attempt < 50) {
    const { data, error } = await supabase().from("blog_posts").select("id").eq("slug", slug).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data || (excludeId && data.id === excludeId)) return slug;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

export async function saveCmsBlog(payload: BlogInput, editingId: string | null) {
  const slug = await uniqueSlug(payload.slug, editingId);
  const row = {
    title: payload.title,
    slug,
    category: payload.category,
    author: payload.author || "Lizaz Team",
    date: payload.date,
    image: payload.image,
    excerpt: payload.excerpt,
    content: payload.content,
    published: payload.published,
    updated_at: new Date().toISOString(),
  };
  const query = editingId
    ? supabase().from("blog_posts").update(row).eq("id", editingId)
    : supabase().from("blog_posts").insert(row);
  const { data, error } = await query.select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Could not save this post");
}

export async function deleteCmsBlog(id: string) {
  const { data, error } = await supabase().from("blog_posts").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Could not delete this post");
}

export async function uploadCmsBlogImage(file: File, slug: string) {
  const ext = IMAGE_EXT[file.type];
  if (!ext) throw new Error("Please upload a JPG, PNG, WEBP, or GIF image");
  if (file.size > 8 * 1024 * 1024) throw new Error("Image must be 8 MB or smaller");

  const safeSlug = slug.replace(/[^a-z0-9-]/g, "").slice(0, 80) || `post-${Date.now()}`;
  const objectPath = `covers/${safeSlug}/cover-${crypto.randomUUID().slice(0, 8)}${ext}`;
  const { error } = await supabase().storage.from("blog-images").upload(objectPath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message || "Could not save the cover image");

  const { data } = supabase().storage.from("blog-images").getPublicUrl(objectPath);
  if (!data.publicUrl) throw new Error("Could not create a public link for the cover image");
  return data.publicUrl;
}
