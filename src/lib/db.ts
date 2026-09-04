import { Pool, types } from "pg";
import { attachDatabasePool } from "@vercel/functions";

// Postgres sends NUMERIC as text by default (arbitrary precision); our
// amounts fit comfortably in a JS double, so parse them to numbers rather
// than threading strings through the whole app.
const OID_NUMERIC = 1700;
types.setTypeParser(OID_NUMERIC, (v) => (v === null ? null : parseFloat(v)));

/**
 * Shared, server-only Postgres pool (Neon, pooled connection). Memoized on
 * globalThis so Vite's dev-server HMR doesn't open a fresh pool on every
 * module reload. `attachDatabasePool` tells Vercel's Fluid compute runtime
 * to keep this pool alive across invocations on the same instance instead
 * of tearing it down after each request.
 */
const globalRef = globalThis as typeof globalThis & { __pgPool__?: Pool };

function getPool(): Pool {
  if (typeof window !== "undefined") {
    throw new Error("@/lib/db is server-only — never import it from client code.");
  }
  if (!globalRef.__pgPool__) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set.");
    const pool = new Pool({ connectionString });
    attachDatabasePool(pool);
    globalRef.__pgPool__ = pool;
  }
  return globalRef.__pgPool__;
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await getPool().query(text, params);
  return res.rows as T[];
}

export async function queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
