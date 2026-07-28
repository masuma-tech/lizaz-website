import type pg from "pg";

function isLocalDatabase(url: string): boolean {
  return /localhost|127\.0\.0\.1/.test(url);
}

export function getPgPoolConfig(): pg.PoolConfig {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  if (isLocalDatabase(connectionString)) {
    return { connectionString };
  }

  // Supabase and other hosted Postgres require SSL.
  return {
    connectionString,
    ssl: { rejectUnauthorized: false },
  };
}
