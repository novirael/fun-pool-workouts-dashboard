import { z } from 'zod';
import { BADGE_IDS } from '@/lib/domain/badges';
import { AppError, authorize, handler, json, readJson } from '@/lib/server/http';
import { deleteAward, getMember, upsertAward } from '@/lib/server/repo';
import { awardPut } from '@/lib/validation';

// Marks an earned badge as handed out in real life (parents only).

type Route = RouteContext<'/api/awards/[memberId]/[badgeId]'>;

async function target(route: Route, db: Parameters<typeof getMember>[0]) {
  const { memberId, badgeId } = await route.params;
  if (!BADGE_IDS.includes(badgeId) || !z.uuid().safeParse(memberId).success) throw new AppError('not_found', 404);
  if (!(await getMember(db, memberId))) throw new AppError('not_found', 404);
  return { memberId, badgeId };
}

export const PUT = handler(async (req, route: Route, { db, actor }) => {
  const me = await actor();
  authorize(me, { action: 'awards.toggle' });
  const t = await target(route, db);
  const { givenOn } = await readJson(req, awardPut);
  return json({ award: await upsertAward(db, { ...t, givenOn, givenBy: me.id }) });
});

export const DELETE = handler(async (_req, route: Route, { db, actor }) => {
  authorize(await actor(), { action: 'awards.toggle' });
  const t = await target(route, db);
  await deleteAward(db, t.memberId, t.badgeId);
  return json({ ok: true });
});
