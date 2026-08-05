import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "./envSetup";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { blogPosts, users } from "../shared/schema";
import { hashPassword } from "./password";
import { createBlogPost } from "./storage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsJsonPath = path.join(__dirname, "..", "scripts", "blog_posts.json");

type SeedPost = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  image: string;
  published: boolean;
  has_content?: boolean;
};

async function seedAdmin() {
  const username = (process.env.ADMIN_USERNAME || "admin").trim();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  // Password lives in Supabase (users.password hash). Never overwrite from .env.
  if (existing.length > 0) {
    console.log(`✓ Admin user already exists in database (username: ${username})`);
    return;
  }

  // First-time bootstrap only — optional env used once, then remove it from .env
  const plainPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!plainPassword) {
    throw new Error(
      "No admin user in Supabase yet. Set ADMIN_PASSWORD in .env once to create it, then remove ADMIN_PASSWORD from .env."
    );
  }

  const adminPassword = await hashPassword(plainPassword);
  await db.insert(users).values({
    username,
    password: adminPassword,
    email: "Info@lizaz.ae",
    name: "Lizaz Admin",
    isAdmin: true,
    canManageBlogs: true,
    canViewLeads: true,
  });

  console.log(`✓ Admin user created in Supabase (username: ${username})`);
  console.log("  Remove ADMIN_PASSWORD from .env — login uses the DB hash only.");
}

async function seedBlogs() {
  if (!fs.existsSync(postsJsonPath)) {
    throw new Error(
      `Missing ${postsJsonPath}. Restore scripts/blog_posts.json before seeding.`
    );
  }

  const raw = fs.readFileSync(postsJsonPath, "utf8");
  const allPosts = JSON.parse(raw) as SeedPost[];
  const posts = allPosts.filter((p) => p.has_content !== false && p.content?.trim());

  // Remove every existing blog so DB matches the Blog folder exactly
  await db.delete(blogPosts);
  console.log("✓ Cleared all existing blog posts");

  for (const post of posts) {
    await createBlogPost({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      author: post.author || "Lizaz Team",
      date: post.date,
      image: post.image,
      published: post.published ?? true,
    });
    console.log(`✓ Blog added: ${post.slug}`);
  }

  const skipped = allPosts.length - posts.length;
  if (skipped > 0) {
    console.log(`⚠ Skipped ${skipped} folder(s) with no article content`);
  }
  console.log(`✓ Seeded ${posts.length} blog posts from Blog folder`);
}

async function seed() {
  console.log("Seeding database...");
  await seedAdmin();
  await seedBlogs();
  console.log("\n✅ Database seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
