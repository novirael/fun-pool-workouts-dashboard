# Pływackie wyprawy / Swim Adventures

A family swim log for the kids' iPads. Log lengths after each training, watch every swimmer climb mountains and cross lakes, collect badges, and move the whole family along a road trip around Poland, starting from Gostynin. The UI is in Polish or English, depending on the device language.

## How it works

- **Stack:** Next.js 16 (App Router) on Vercel and Neon Postgres via Drizzle ORM. TanStack Query on the client.
- **One shared password** (`APP_PASSWORD`):
  - The device trades it for a token (`HMAC(AUTH_SECRET, password)`) and keeps the token in `localStorage`.
  - If the password or secret changes, every device is asked again.
  - Letter case and surrounding spaces don't matter when typing it.
- **"Who's here?":**
  - Each device remembers which family member is using it.
  - The app opens on *Trening* with that person's card already switched on.
  - Every entry records who added it.
- **Roles (honor system):**
  - Parents manage the family (⚙️ *Rodzina*), mark badges as handed out, and can delete any entry.
  - Children can log for anyone, but only delete their own entries and change their own animal.
- **Family data lives only in the database.** Names, ages and goals are entered in the app (*Rodzina*), never in code. This repository is public.
- **Language:** Polish or English is picked from the device's preferred languages. Add `?lang=en` or `?lang=pl` to the URL to force one.

```
app/            pages, API route handlers (app/api/*), manifest, icons
components/     client UI (the whole app renders in the browser)
lib/domain/     pure logic ported from the prototype: stats, streaks, badges, ladders, route
lib/i18n/       PL/EN dictionaries, locale detection, formatting
lib/server/     database, schema, auth, request handling
lib/client/     API client, queries/mutations, local storage
drizzle/        SQL migrations (generated)
tests/          API tests against an in-memory Postgres (PGlite)
```

## Local development

```bash
npm ci
cp .env.example .env.local   # set APP_PASSWORD and AUTH_SECRET
npm run dev                  # http://localhost:3000
```

- If `DATABASE_URL` isn't set, `npm run dev` uses an embedded Postgres (PGlite) stored in `.data/`. Delete that folder to start over.
- On first run the app asks you to add yourself as a parent.

```bash
npm run check                # typecheck + lint + tests
npm run db:generate          # after changing lib/server/schema.ts: writes a new SQL migration
```

Keep migrations additive. During a deploy, the previous version keeps serving until the new one is live.

## Deployment (Vercel)

- **Project:** `fun-pool-workouts-dashboard`, region `fra1`. Every push to `main` deploys to production.
- **Database:** Neon Postgres from the Vercel Marketplace, connected to **Production** only. It provides `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
- **Environment variables (Production and Preview):**
  - `APP_PASSWORD`
  - `AUTH_SECRET`
- **Build:** `npm run build && npm run db:migrate`. Migrations run only when `VERCEL_ENV=production`, after a successful build, and in a single transaction.
- **Preview deployments** have no database by default, so they never touch family data. They are protected by Vercel Authentication.
- **Rate limit:** a Vercel Firewall rule limits `POST /api/auth`.

To change the password, edit `APP_PASSWORD` in Vercel and redeploy. Every device will then ask for the new one.

## On the iPads

1. Open the site in Safari, then tap **Share → Add to Home Screen**.
2. Open the app from the new icon and enter the family password once.
3. Pick who uses that iPad.

Use the home-screen app rather than a Safari tab. Safari clears website storage after about a week without a visit, but home-screen apps keep it.

## Backup

As a parent, open **⚙️ Rodzina → Pobierz kopię danych / Download data backup** to download a JSON copy of everything.
