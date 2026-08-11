import type { BlogPost, InsertContact } from "@shared/schema";
import { requireSupabase } from "@/lib/supabase";

type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  image: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

function mapBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    author: row.author,
    date: row.date,
    image: row.image,
    published: row.published,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function fetchPublishedBlogs(): Promise<BlogPost[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as BlogPostRow[]).map(mapBlogPost);
}

export async function fetchBlogBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapBlogPost(data as BlogPostRow) : null;
}

export async function submitContact(payload: InsertContact): Promise<void> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke("send-contact-email", {
    body: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone || "",
      service: payload.service || "",
      subject: payload.subject || "",
      message: payload.message,
    },
  });

  if (error) throw new Error(error.message || "Failed to submit inquiry");
  if (data?.error) throw new Error(String(data.error));
}
