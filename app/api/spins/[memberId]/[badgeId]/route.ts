import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { BADGE_IDS, badgeDates } from '@/lib/domain/badges';
import { pickWeighted, totalWeight } from '@/lib/domain/prizes';
import { byDateThenTs } from '@/lib/domain/stats';
import { AppError, authorize, handler, json } from '@/lib/server/http';
import { deleteSpin, getMember, getSpin, insertSpin, listPrizes, sessionsOf } from '@/lib/server/repo';

// Wheel of fortune for an earned badge. The server draws the prize, so refreshing or spinning
// on another device can't reroll it; only a parent can reset a result.

type Route = RouteContext<'/api/spins/[memberId]/[badgeId]'>;

async function target(route: Route, db: Parameters<typeof getMember>[0]) {
  const { memberId, badgeId } = await route.params;
  if (!BADGE_IDS.includes(badgeId) || !z.uuid().safeParse(memberId).success) throw new AppError('not_found', 404);
  const member = await getMember(db, memberId);
  if (!member) throw new AppError('not_found', 404);
  return { member, badgeId };
}

export const POST = handler(async (_req, route: Route, { db, actor }) => {
  const me = await actor();
  const { member, badgeId } = await target(route, db);
  authorize(me, { action: 'badge.spin', memberId: member.id });

  const existing = await getSpin(db, member.id, badgeId);
  if (existing) return json({ spin: existing, prizes: await listPrizes(db) });

  // Badges are derived from the sessions; check on the server that this one is really earned.
  const earned = badgeDates(member, (await sessionsOf(db, member.id)).sort(byDateThenTs));
  if (!earned[badgeId]) throw new AppError('not_earned', 409);

  const prizes = await listPrizes(db);
  if (!prizes.length) throw new AppError('no_prizes', 409);
  const prize = pickWeighted(prizes, randomInt(totalWeight(prizes)));
  const spin = await insertSpin(db, { memberId: member.id, badgeId, prizeId: prize.id, prizeName: prize.name, spunBy: me.id });
  return json({ spin, prizes }, 201);
});

export const DELETE = handler(async (_req, route: Route, { db, actor }) => {
  authorize(await actor(), { action: 'badge.respin' });
  const { member, badgeId } = await target(route, db);
  await deleteSpin(db, member.id, badgeId);
  return json({ ok: true });
});
