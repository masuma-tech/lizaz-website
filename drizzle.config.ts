import dns from "dns";
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Supabase direct hostnames are IPv6-only; Windows Node needs this to resolve them.
dns.setDefaultResultOrder("ipv6first");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const url = process.env.DATABASE_URL;
const isLocal = /localhost|127\.0\.0\.1/.test(url);

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url,
    ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
  },
});
