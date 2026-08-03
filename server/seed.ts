import "./envSetup";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "../shared/schema";
import { hashPassword } from "./password";
import { upsertBlogPostBySlug } from "./storage";

const seedPosts = [
  {
    title: "A Complete Guide to UAE Visa Types and Requirements",
    slug: "uae-visa-types-and-requirements",
    excerpt:
      "Understand employment, visit, family, and residence visas in the UAE. Learn which visa suits your situation and what documents you need to apply.",
    content:
      "This guide walks through each UAE visa type in plain language, the documents required for visa applications, and where applicants most often get tripped up during UAE visa processing. Lizaz helps you clear the entire path, from attestation to approval.",
    category: "Visa Services",
    author: "Lizaz Team",
    date: "15, Mar 2025",
    image: "attached_assets/images/visa.jpg",
    published: true,
  },
  {
    title: "Starting a Business in the UAE: Mainland vs Free Zone",
    slug: "starting-a-business-mainland-vs-free-zone",
    excerpt:
      "Compare mainland and free zone company formation options, licensing costs, visa quotas, and key steps to launch your business in Dubai.",
    content:
      "Choosing between mainland and free zone company formation affects licensing, ownership, visa quotas, and where you can operate. This article breaks down the practical differences so you can pick the right setup for your goals.",
    category: "Business Setup",
    author: "Lizaz Team",
    date: "10, Feb 2025",
    image: "attached_assets/images/business.jpg",
    published: true,
  },
  {
    title: "Certificate Attestation in the UAE: Step-by-Step Guide",
    slug: "certificate-attestation-uae-guide",
    excerpt:
      "Learn how MOFA, embassy, and consulate attestation works for educational, personal, and commercial documents — and how to avoid common delays.",
    content:
      "Attestation often involves multiple authorities. This step-by-step guide covers MOFA, embassy, and consulate requirements for educational, personal, and commercial documents, plus the mistakes that most often cause delays.",
    category: "Document Clearance",
    author: "Lizaz Team",
    date: "22, Jan 2025",
    image: "attached_assets/images/doc_clearance.jpg",
    published: true,
  },
  {
    title: "UAE Immigration Compliance: What Expats Need to Know",
    slug: "uae-immigration-compliance-expats",
    excerpt:
      "Residency rules, status changes, entry permits, and overstay penalties — a practical overview for individuals and families living in the UAE.",
    content:
      "Staying compliant in the UAE means understanding residency rules, status changes, entry permits, and overstay risks. This overview gives individuals and families a clear starting point before they make a move.",
    category: "Immigration",
    author: "Lizaz Team",
    date: "8, Jan 2025",
    image: "attached_assets/images/embassy.jpg",
    published: true,
  },
  {
    title: "PRO Services Explained: Why Your UAE Business Needs One",
    slug: "pro-services-explained",
    excerpt:
      "From visa processing to government liaison and license renewals — how PRO services keep your business compliant and running smoothly.",
    content:
      "A PRO handles government liaison, visa processing, and license renewals so your business stays compliant without you chasing every department. This article explains what PRO support covers and when you need it.",
    category: "Business Setup",
    author: "Lizaz Team",
    date: "18, Dec 2024",
    image: "attached_assets/images/tax.jpg",
    published: true,
  },
];

async function seedAdmin() {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, "admin"))
    .limit(1);

  if (existing.length > 0) {
    console.log("✓ Admin user already exists — skipping");
    return;
  }

  const adminPassword = await hashPassword("admin123");
  await db.insert(users).values({
    username: "admin",
    password: adminPassword,
    email: "Info@lizaz.ae",
    name: "Lizaz Admin",
    isAdmin: true,
    canManageBlogs: true,
    canViewLeads: true,
  });

  console.log("✓ Admin user created (username: admin, password: admin123)");
}

async function seedBlogs() {
  for (const post of seedPosts) {
    await upsertBlogPostBySlug(post);
    console.log(`✓ Blog ready: ${post.slug}`);
  }
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
