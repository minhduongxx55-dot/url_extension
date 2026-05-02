import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a PostgreSQL database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

/**
 * Small production-safe bootstrap for Railway/Render style deploys.
 * It prevents first deploy from failing with: relation "entries" does not exist.
 * For a larger project, replace this with proper Drizzle migrations.
 */
export async function ensureDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS entries (
      id SERIAL PRIMARY KEY,
      code TEXT,
      keyword TEXT,
      url TEXT NOT NULL,
      is_valid BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`ALTER TABLE entries ADD COLUMN IF NOT EXISTS code TEXT;`);
  await pool.query(`ALTER TABLE entries ADD COLUMN IF NOT EXISTS keyword TEXT;`);
  await pool.query(`ALTER TABLE entries ADD COLUMN IF NOT EXISTS url TEXT;`);
  await pool.query(
    `ALTER TABLE entries ADD COLUMN IF NOT EXISTS is_valid BOOLEAN NOT NULL DEFAULT false;`,
  );
  await pool.query(
    `ALTER TABLE entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();`,
  );
  await pool.query(
    `ALTER TABLE entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();`,
  );

  await pool.query(`CREATE INDEX IF NOT EXISTS entries_code_idx ON entries (code);`);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS entries_keyword_idx ON entries (keyword);`,
  );
}

export * from "./schema";
