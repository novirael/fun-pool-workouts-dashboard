import { z } from 'zod';
import { AppError, authorize, handler, json, readJson } from '@/lib/server/http';
import { deletePrize, updatePrize } from '@/lib/server/repo';
import { prizePatch } from '@/lib/validation';

type Route = RouteContext<'/api/prizes/[id]'>;

async function target(route: Route) {
  const { id } = await route.params;
  if (!z.uuid().safeParse(id).success) throw new AppError('not_found', 404);
  return id;
}

export const PATCH = handler(async (req, route: Route, { db, actor }) => {
  authorize(await actor(), { action: 'prizes.manage' });
  const id = await target(route);
  const prize = await updatePrize(db, id, await readJson(req, prizePatch));
  if (!prize) throw new AppError('not_found', 404);
  return json({ prize });
});

export const DELETE = handler(async (_req, route: Route, { db, actor }) => {
  authorize(await actor(), { action: 'prizes.manage' });
  await deletePrize(db, await target(route));
  return json({ ok: true });
});
