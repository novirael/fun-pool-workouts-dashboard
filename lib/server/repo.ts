import 'server-only';
import { and, asc, count, eq, inArray, ne } from 'drizzle-orm';
import type { ColorKey } from '@/lib/domain/palette';
import type { Award, FamilyState, Member, PoolLength, Prize, Session, Spin } from '@/lib/domain/types';
import type { MemberInput, MemberPatch, PrizeInput, SessionInput } from '@/lib/validation';
import type { DB } from './db';
import { badgeAwards, badgeSpins, members, prizes, swimSessions } from './schema';

// Data access. Each write is one SQL statement (neon-http has no transactions). Guards such as
// "keep at least one parent" read first and then write; races are irrelevant at family scale.

type MemberRow = typeof members.$inferSelect;
type SessionRow = typeof swimSessions.$inferSelect;
type AwardRow = typeof badgeAwards.$inferSelect;
type PrizeRow = typeof prizes.$inferSelect;
type SpinRow = typeof badgeSpins.$inferSelect;

const toMember = (r: MemberRow): Member => ({
  id: r.id,
  name: r.name,
  subtitle: r.subtitle,
  role: r.role,
  swims: r.swims,
  color: r.color as ColorKey,
  avatar: r.avatar,
  defaultLengthsSmall: r.defaultLengthsSmall,
  defaultLengthsDeep: r.defaultLengthsDeep,
  monthlyPaceM: r.monthlyPaceM,
  recordGoalsM: r.recordGoalsM,
  archived: r.archived,
});

const toSession = (r: SessionRow): Session => ({
  id: r.id,
  swimmerId: r.swimmerId,
  createdBy: r.createdBy,
  date: r.date,
  lengths: r.lengths,
  pool: r.poolM as PoolLength,
  ts: r.createdAt.getTime(),
});

const toAward = (r: AwardRow): Award => ({ memberId: r.memberId, badgeId: r.badgeId, givenOn: r.givenOn, givenBy: r.givenBy });

const toPrize = (r: PrizeRow): Prize => ({ id: r.id, name: r.name, weight: r.weight });

const toSpin = (r: SpinRow): Spin => ({
  memberId: r.memberId,
  badgeId: r.badgeId,
  prizeId: r.prizeId,
  prizeName: r.prizeName,
  spunBy: r.spunBy,
  ts: r.spunAt.getTime(),
});

export async function loadState(db: DB): Promise<FamilyState> {
  const [ms, ss, as, ps, sp] = await Promise.all([
    db.select().from(members).orderBy(asc(members.createdAt), asc(members.id)),
    db.select().from(swimSessions).orderBy(asc(swimSessions.date), asc(swimSessions.createdAt)),
    db.select().from(badgeAwards),
    listPrizes(db),
    db.select().from(badgeSpins),
  ]);
  return { members: ms.map(toMember), sessions: ss.map(toSession), awards: as.map(toAward), prizes: ps, spins: sp.map(toSpin) };
}

export async function getMember(db: DB, id: string): Promise<Member | null> {
  const [r] = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return r ? toMember(r) : null;
}

export async function countMembers(db: DB): Promise<{ total: number; activeSwimmers: number }> {
  const [all] = await db.select({ n: count() }).from(members);
  const [sw] = await db.select({ n: count() }).from(members).where(and(eq(members.swims, true), eq(members.archived, false)));
  return { total: all?.n ?? 0, activeSwimmers: sw?.n ?? 0 };
}

/** Active parents other than `exceptId`. */
export async function countOtherParents(db: DB, exceptId: string): Promise<number> {
  const [r] = await db
    .select({ n: count() })
    .from(members)
    .where(and(eq(members.role, 'parent'), eq(members.archived, false), ne(members.id, exceptId)));
  return r?.n ?? 0;
}

export async function insertMember(db: DB, input: MemberInput): Promise<Member> {
  const [r] = await db.insert(members).values(input).returning();
  return toMember(r!);
}

export async function updateMember(db: DB, id: string, patch: MemberPatch): Promise<Member | null> {
  const [r] = await db.update(members).set(patch).where(eq(members.id, id)).returning();
  return r ? toMember(r) : null;
}

/** Throws a restrict violation (23001) when the member still has sessions or awards. */
export async function deleteMember(db: DB, id: string): Promise<boolean> {
  const rows = await db.delete(members).where(eq(members.id, id)).returning({ id: members.id });
  return rows.length > 0;
}

/** Ids of the given members that are active swimmers. */
export async function activeSwimmerIds(db: DB, ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const rows = await db
    .select({ id: members.id })
    .from(members)
    .where(and(inArray(members.id, ids), eq(members.swims, true), eq(members.archived, false)));
  return new Set(rows.map((r) => r.id));
}

/** Idempotent: sessions whose id already exists are left as they are. Returns the stored rows. */
export async function insertSessions(db: DB, list: SessionInput[], createdBy: string): Promise<Session[]> {
  await db
    .insert(swimSessions)
    .values(list.map((s) => ({ id: s.id, swimmerId: s.swimmerId, createdBy, date: s.date, lengths: s.lengths, poolM: s.pool })))
    .onConflictDoNothing({ target: swimSessions.id });
  const rows = await db.select().from(swimSessions).where(inArray(swimSessions.id, list.map((s) => s.id)));
  return rows.map(toSession);
}

export async function getSession(db: DB, id: string): Promise<Session | null> {
  const [r] = await db.select().from(swimSessions).where(eq(swimSessions.id, id)).limit(1);
  return r ? toSession(r) : null;
}

export async function deleteSession(db: DB, id: string): Promise<void> {
  await db.delete(swimSessions).where(eq(swimSessions.id, id));
}

export async function upsertAward(db: DB, a: Award): Promise<Award> {
  const [r] = await db
    .insert(badgeAwards)
    .values(a)
    .onConflictDoUpdate({ target: [badgeAwards.memberId, badgeAwards.badgeId], set: { givenOn: a.givenOn, givenBy: a.givenBy } })
    .returning();
  return toAward(r!);
}

export async function deleteAward(db: DB, memberId: string, badgeId: string): Promise<void> {
  await db.delete(badgeAwards).where(and(eq(badgeAwards.memberId, memberId), eq(badgeAwards.badgeId, badgeId)));
}

export async function sessionsOf(db: DB, swimmerId: string): Promise<Session[]> {
  const rows = await db.select().from(swimSessions).where(eq(swimSessions.swimmerId, swimmerId));
  return rows.map(toSession);
}

export async function listPrizes(db: DB): Promise<Prize[]> {
  const rows = await db.select().from(prizes).orderBy(asc(prizes.createdAt), asc(prizes.id));
  return rows.map(toPrize);
}

export async function insertPrize(db: DB, input: PrizeInput): Promise<Prize> {
  const [r] = await db.insert(prizes).values(input).returning();
  return toPrize(r!);
}

export async function updatePrize(db: DB, id: string, patch: Partial<PrizeInput>): Promise<Prize | null> {
  const [r] = await db.update(prizes).set(patch).where(eq(prizes.id, id)).returning();
  return r ? toPrize(r) : null;
}

/** Spins keep the prize name, so removing a prize never loses a result. */
export async function deletePrize(db: DB, id: string): Promise<void> {
  await db.delete(prizes).where(eq(prizes.id, id));
}

export async function getSpin(db: DB, memberId: string, badgeId: string): Promise<Spin | null> {
  const [r] = await db.select().from(badgeSpins).where(and(eq(badgeSpins.memberId, memberId), eq(badgeSpins.badgeId, badgeId))).limit(1);
  return r ? toSpin(r) : null;
}

/** Records a spin unless the badge already has one; returns the stored result either way. */
export async function insertSpin(db: DB, s: Omit<Spin, 'ts'>): Promise<Spin> {
  await db.insert(badgeSpins).values(s).onConflictDoNothing({ target: [badgeSpins.memberId, badgeSpins.badgeId] });
  return (await getSpin(db, s.memberId, s.badgeId))!;
}

export async function deleteSpin(db: DB, memberId: string, badgeId: string): Promise<void> {
  await db.delete(badgeSpins).where(and(eq(badgeSpins.memberId, memberId), eq(badgeSpins.badgeId, badgeId)));
}

/** Postgres SQLSTATE of an error from either driver (drizzle wraps driver errors in `cause`). */
export function pgCode(e: unknown): string | undefined {
  for (let x: unknown = e, i = 0; x && i < 4; x = (x as { cause?: unknown }).cause, i++) {
    const code = (x as { code?: unknown }).code;
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) return code;
  }
  return undefined;
}
