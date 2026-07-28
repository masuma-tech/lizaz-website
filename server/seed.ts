import "./envSetup.js";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import { hashPassword } from "./password";

async function seed() {
  console.log("Seeding database...");

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, "admin"))
    .limit(1);

  if (existing.length > 0) {
    console.log("✓ Admin user already exists — skipping");
    process.exit(0);
  }

  const adminPassword = await hashPassword("admin123");
  await db.insert(users).values({
    username: "admin",
    password: adminPassword,
    isAdmin: true,
    canManageBlogs: true,
    canViewLeads: true,
  });

  console.log("✓ Admin user created (username: admin, password: admin123)");
  console.log("\n✅ Database seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
