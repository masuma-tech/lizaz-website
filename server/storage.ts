import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import {
  blogPosts,
  contacts,
  type InsertBlogPost,
  type InsertContact,
} from "../shared/schema";

export async function createContact(data: InsertContact) {
  const [row] = await db.insert(contacts).values(data).returning();
  return row;
}

export async function listContacts() {
  return db.select().from(contacts).orderBy(desc(contacts.createdAt));
}

export async function listPublishedBlogPosts() {
  return db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(desc(blogPosts.createdAt));
}

export async function getBlogPostBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function createBlogPost(data: InsertBlogPost) {
  const [row] = await db.insert(blogPosts).values(data).returning();
  return row;
}

export async function upsertBlogPostBySlug(data: InsertBlogPost) {
  const existing = await getBlogPostBySlug(data.slug);
  if (existing) {
    const [row] = await db
      .update(blogPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(blogPosts.slug, data.slug))
      .returning();
    return row;
  }
  return createBlogPost(data);
}
