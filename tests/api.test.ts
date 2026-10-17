import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as awardRoute from '@/app/api/awards/[memberId]/[badgeId]/route';
import * as authRoute from '@/app/api/auth/route';
import * as exportRoute from '@/app/api/export/route';
import * as memberRoute from '@/app/api/members/[id]/route';
import * as membersRoute from '@/app/api/members/route';
import * as sessionRoute from '@/app/api/sessions/[id]/route';
import * as sessionsRoute from '@/app/api/sessions/route';
import * as stateRoute from '@/app/api/state/route';
import { addDays, todayIn } from '@/lib/domain/dates';
import type { FamilyState, Member } from '@/lib/domain/types';
import { setDb, type DB } from '@/lib/server/db';
import * as schema from '@/lib/server/schema';

// Route handlers invoked directly against an in-memory Postgres (PGlite) with the real migrations.

const PASSWORD = 'delfin-foka-42';
let client: PGlite;
let token = '';

type Handler = (req: Request, route: { params: Promise<Record<string, string>> }) => Promise<Response>;
interface CallOpts {
  body?: unknown;
  token?: string | null;
  member?: string;
  params?: Record<string, string>;
}

async function call(fn: unknown, { body, token: tk = token, member, params = {} }: CallOpts = {}) {
  const headers = new Headers();
  if (tk) headers.set('authorization', `Bearer ${tk}`);
  if (member) headers.set('x-member-id', member);
  if (body !== undefined) headers.set('content-type', 'application/json');
  const req = new Request('http://test/api', { method: body === undefined ? 'GET' : 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const res = await (fn as Handler)(req, { params: Promise.resolve(params) });
  return { status: res.status, body: await res.json(), headers: res.headers };
}

const person = (over: Partial<Member> = {}) => ({
  name: 'Ala',
  subtitle: '8 lat',
  role: 'child',
  swims: true,
  color: 'orange',
  avatar: '🦦',
  defaultLengths: 20,
  monthlyPaceM: 3000,
  recordGoalsM: [1000, 1250, 1500, 2000],
  ...over,
});

const uuid = () => crypto.randomUUID();
const today = () => todayIn('Europe/Warsaw');

async function state(): Promise<FamilyState> {
  return (await call(stateRoute.GET)).body;
}

/** A parent (created at first run) and a child. */
async function family() {
  const parent: Member = (await call(membersRoute.POST, { body: person({ name: 'Mama', role: 'parent' }) })).body.member;
  const kid: Member = (await call(membersRoute.POST, { body: person({ name: 'Olek' }), member: parent.id })).body.member;
  return { parent, kid };
}

async function swim(actor: string, swimmerId: string, extra: Record<string, unknown> = {}) {
  const s = { id: uuid(), swimmerId, date: today(), lengths: 20, pool: 25, ...extra };
  const r = await call(sessionsRoute.POST, { body: { sessions: [s] }, member: actor });
  return { ...r, id: s.id };
}

beforeAll(async () => {
  process.env.APP_PASSWORD = PASSWORD;
  process.env.AUTH_SECRET = 'test-secret';
  client = new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: 'drizzle' });
  setDb(db as unknown as DB);
  token = (await call(authRoute.POST, { body: { password: PASSWORD }, token: null })).body.token;
});

beforeEach(async () => {
  process.env.APP_PASSWORD = PASSWORD;
  await client.exec('truncate badge_awards, swim_sessions, members cascade');
});

describe('auth', () => {
  it('issues a token for the right password, forgiving case and spaces', async () => {
    const r = await call(authRoute.POST, { body: { password: '  Delfin-Foka-42 ' }, token: null });
    expect(r.status).toBe(200);
    expect(r.body.token).toBe(token);
  });

  it('rejects a wrong password', async () => {
    const r = await call(authRoute.POST, { body: { password: 'rekin' }, token: null });
    expect(r).toMatchObject({ status: 401, body: { error: 'invalid_password' } });
  });

  it('protects every data route', async () => {
    expect((await call(stateRoute.GET, { token: null })).status).toBe(401);
    expect((await call(stateRoute.GET, { token: 'forged' })).status).toBe(401);
    expect((await call(stateRoute.GET)).status).toBe(200);
  });

  it('invalidates stored tokens when the password changes', async () => {
    process.env.APP_PASSWORD = 'nowe-haslo-7';
    expect((await call(stateRoute.GET)).body).toEqual({ error: 'unauthorized' });
  });

  it('refuses to work without configuration', async () => {
    delete process.env.APP_PASSWORD;
    expect((await call(authRoute.POST, { body: { password: PASSWORD }, token: null })).body.error).toBe('not_configured');
    expect((await call(stateRoute.GET)).status).toBe(500);
  });

  it('sends no-store and a version header', async () => {
    const r = await call(stateRoute.GET);
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect(r.headers.get('x-app-version')).toBe('dev');
  });
});

describe('members', () => {
  it('makes the very first member a parent, without an actor', async () => {
    const r = await call(membersRoute.POST, { body: person({ role: 'child' }) });
    expect(r.status).toBe(201);
    expect(r.body.member.role).toBe('parent');
    expect((await call(membersRoute.POST, { body: person() })).body.error).toBe('member_unknown');
  });

  it('lets only parents manage the family', async () => {
    const { parent, kid } = await family();
    expect((await call(membersRoute.POST, { body: person(), member: kid.id })).body.error).toBe('forbidden');
    expect((await call(memberRoute.PATCH, { body: { name: 'X' }, member: kid.id, params: { id: kid.id } })).body.error).toBe('forbidden');
    expect((await call(memberRoute.PATCH, { body: { subtitle: '9 lat' }, member: parent.id, params: { id: kid.id } })).body.member.subtitle).toBe('9 lat');
  });

  it('lets children change only their own animal', async () => {
    const { parent, kid } = await family();
    expect((await call(memberRoute.PATCH, { body: { avatar: '🐙' }, member: kid.id, params: { id: kid.id } })).body.member.avatar).toBe('🐙');
    expect((await call(memberRoute.PATCH, { body: { avatar: '🐙' }, member: kid.id, params: { id: parent.id } })).body.error).toBe('forbidden');
    expect((await call(memberRoute.PATCH, { body: { avatar: '💩' }, member: kid.id, params: { id: kid.id } })).body.error).toBe('validation');
  });

  it('keeps at least one parent', async () => {
    const { parent } = await family();
    const p = { member: parent.id, params: { id: parent.id } };
    expect((await call(memberRoute.PATCH, { body: { archived: true }, ...p })).body.error).toBe('last_parent');
    expect((await call(memberRoute.PATCH, { body: { role: 'child' }, ...p })).body.error).toBe('last_parent');
    expect((await call(memberRoute.DELETE, p)).body.error).toBe('last_parent');
    await call(membersRoute.POST, { body: person({ name: 'Tata', role: 'parent' }), member: parent.id });
    expect((await call(memberRoute.PATCH, { body: { archived: true }, ...p })).status).toBe(200);
  });

  it('deletes only members nothing refers to', async () => {
    const { parent, kid } = await family();
    await swim(parent.id, kid.id);
    expect((await call(memberRoute.DELETE, { member: parent.id, params: { id: kid.id } })).body.error).toBe('in_use');
    const extra: Member = (await call(membersRoute.POST, { body: person({ name: 'Gość' }), member: parent.id })).body.member;
    expect((await call(memberRoute.DELETE, { member: parent.id, params: { id: extra.id } })).status).toBe(200);
    expect((await state()).members.map((m) => m.name)).toEqual(['Mama', 'Olek']);
  });

  it('rejects archived or unknown actors', async () => {
    const { parent, kid } = await family();
    await call(memberRoute.PATCH, { body: { archived: true }, member: parent.id, params: { id: kid.id } });
    expect((await swim(kid.id, parent.id)).body.error).toBe('member_unknown');
    expect((await swim(uuid(), parent.id)).body.error).toBe('member_unknown');
    expect((await swim('not-a-uuid', parent.id)).body.error).toBe('member_unknown');
  });

  it('validates input', async () => {
    const { parent } = await family();
    const bad = await call(membersRoute.POST, { body: person({ recordGoalsM: [1000, 900, 1500, 2000] }), member: parent.id });
    expect(bad.status).toBe(400);
    expect(bad.body.details[0]).toMatchObject({ path: 'recordGoalsM', message: 'records_not_ascending' });
  });
});

describe('sessions', () => {
  it('records who added the entry, ignoring the body', async () => {
    const { parent, kid } = await family();
    const r = await swim(parent.id, kid.id, { createdBy: kid.id });
    expect(r.status).toBe(201);
    const s = (await state()).sessions[0]!;
    expect(s).toMatchObject({ swimmerId: kid.id, createdBy: parent.id, lengths: 20, pool: 25, date: today() });
    expect(typeof s.ts).toBe('number');
  });

  it('is idempotent for retried saves', async () => {
    const { parent, kid } = await family();
    const body = { sessions: [{ id: uuid(), swimmerId: kid.id, date: today(), lengths: 12, pool: 15 }] };
    await call(sessionsRoute.POST, { body, member: parent.id });
    const again = await call(sessionsRoute.POST, { body, member: parent.id });
    expect(again.status).toBe(201);
    expect(again.body.sessions).toHaveLength(1);
    expect((await state()).sessions).toHaveLength(1);
  });

  it('rejects bad entries', async () => {
    const { parent, kid } = await family();
    const nonSwimmer: Member = (await call(membersRoute.POST, { body: person({ name: 'Babcia', swims: false }), member: parent.id })).body.member;
    expect((await swim(parent.id, kid.id, { date: addDays(today(), 3) })).status).toBe(400);
    expect((await swim(parent.id, kid.id, { date: '2019-12-31' })).status).toBe(400);
    expect((await swim(parent.id, kid.id, { pool: 20 })).status).toBe(400);
    expect((await swim(parent.id, kid.id, { lengths: 0 })).status).toBe(400);
    expect((await swim(parent.id, nonSwimmer.id)).body.details[0].message).toBe('unknown_swimmer');
    const seven = Array.from({ length: 7 }, () => ({ id: uuid(), swimmerId: kid.id, date: today(), lengths: 1, pool: 25 }));
    expect((await call(sessionsRoute.POST, { body: { sessions: seven }, member: parent.id })).status).toBe(400);
    const dup = [kid.id, kid.id].map((swimmerId) => ({ id: uuid(), swimmerId, date: today(), lengths: 1, pool: 25 }));
    expect((await call(sessionsRoute.POST, { body: { sessions: dup }, member: parent.id })).status).toBe(400);
    expect((await state()).sessions).toHaveLength(0);
  });

  it('lets children delete only their own entries', async () => {
    const { parent, kid } = await family();
    const other: Member = (await call(membersRoute.POST, { body: person({ name: 'Ela' }), member: parent.id })).body.member;
    const forOther = await swim(parent.id, other.id);
    const forKid = await swim(parent.id, kid.id);
    const byKid = await swim(kid.id, other.id);
    expect((await call(sessionRoute.DELETE, { member: kid.id, params: { id: forOther.id } })).body.error).toBe('forbidden');
    expect((await call(sessionRoute.DELETE, { member: kid.id, params: { id: forKid.id } })).status).toBe(200);
    expect((await call(sessionRoute.DELETE, { member: kid.id, params: { id: byKid.id } })).status).toBe(200);
    expect((await call(sessionRoute.DELETE, { member: parent.id, params: { id: forOther.id } })).status).toBe(200);
    // Deleting twice is fine (retries).
    expect((await call(sessionRoute.DELETE, { member: parent.id, params: { id: forOther.id } })).status).toBe(200);
    expect((await state()).sessions).toHaveLength(0);
  });
});

describe('awards and export', () => {
  it('lets parents mark badges as handed out', async () => {
    const { parent, kid } = await family();
    const params = { memberId: kid.id, badgeId: 'kijanka' };
    expect((await call(awardRoute.PUT, { body: { givenOn: today() }, member: kid.id, params })).body.error).toBe('forbidden');
    const r = await call(awardRoute.PUT, { body: { givenOn: today() }, member: parent.id, params });
    expect(r.body.award).toEqual({ memberId: kid.id, badgeId: 'kijanka', givenOn: today(), givenBy: parent.id });
    await call(awardRoute.PUT, { body: { givenOn: '2026-01-02' }, member: parent.id, params });
    expect((await state()).awards).toEqual([{ ...r.body.award, givenOn: '2026-01-02' }]);
    expect((await call(awardRoute.PUT, { body: { givenOn: today() }, member: parent.id, params: { ...params, badgeId: 'nope' } })).status).toBe(404);
    expect((await call(awardRoute.DELETE, { member: parent.id, params })).status).toBe(200);
    expect((await state()).awards).toEqual([]);
  });

  it('exports everything for parents only', async () => {
    const { parent, kid } = await family();
    await swim(kid.id, kid.id);
    expect((await call(exportRoute.GET, { member: kid.id })).body.error).toBe('forbidden');
    const r = await call(exportRoute.GET, { member: parent.id });
    expect(r.body).toMatchObject({ app: 'fun-pool-workouts-dashboard', version: 1 });
    expect(r.body.members).toHaveLength(2);
    expect(r.body.sessions[0].createdBy).toBe(kid.id);
  });
});
