#!/usr/bin/env node
// Applies migrations/*.sql against Neon, tracked in a `_migrations` table so
// each file runs exactly once. Uses the DIRECT (unpooled) connection per
// Neon's guidance — migrations need session-level behavior a pooled
// (PgBouncer transaction-mode) connection doesn't support.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "migrations");

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set.");
  process.exit(1);
}

const client = new Client({ connectionString });
await client.connect();

try {
  await client.query(
    "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
  );

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const { rows } = await client.query("select name from _migrations");
  const applied = new Set(rows.map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`applying ${file}...`);
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into _migrations (name) values ($1)", [file]);
      await client.query("commit");
    } catch (err) {
      await client.query("rollback");
      throw new Error(`migration ${file} failed: ${err.message}`, { cause: err });
    }
  }

  console.log("migrations up to date.");
} finally {
  await client.end();
}
