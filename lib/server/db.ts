import 'server-only';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema';

// Production: Neon over HTTP (one stateless request per query, nothing to pool).
// Local dev without DATABASE_URL: an embedded PGlite database in .data/, migrated on first use.
// Tests inject an in-memory PGlite via setDb().
// Every write in the repo layer is a single SQL statement, because neon-http has no transactions.

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

const g = globalThis as unknown as { __poolDb?: Promise<DB> };

export function getDb(): Promise<DB> {
  // Don't cache a failed attempt, so the next request can try again.
  g.__poolDb ??= connect().catch((e) => {
    g.__poolDb = undefined;
    throw e;
  });
  return g.__poolDb;
}

/** Tests only. */
export function setDb(db: DB) {
  g.__poolDb = Promise.resolve(db);
}

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-http');
    return drizzle({ client: neon(url), schema }) as unknown as DB;
  }
  if (process.env.VERCEL) throw new Error('DATABASE_URL is not set. Connect the Neon database to this Vercel environment.');
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), '.data', 'pglite');
  await mkdir(dir, { recursive: true });
  const db = drizzle({ client: new PGlite(dir), schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  return db as unknown as DB;
}
