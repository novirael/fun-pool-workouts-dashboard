import path from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

// Applies pending SQL migrations from ./drizzle in one transaction.
// Runs on Vercel production builds (after `next build`), or anywhere with --force.
// Migrations must be additive: the previous deployment keeps serving until the new one is live.

async function main() {
  const env = process.env.VERCEL_ENV;
  if (env !== 'production' && !process.argv.includes('--force')) {
    console.log(`[migrate] skipped (VERCEL_ENV=${env ?? 'unset'}); pass --force to run anyway`);
    return;
  }
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) throw new Error('[migrate] DATABASE_URL_UNPOOLED / DATABASE_URL is not set. Connect the Neon database to this environment.');
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder: path.join(process.cwd(), 'drizzle') });
    console.log('[migrate] database is up to date');
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
