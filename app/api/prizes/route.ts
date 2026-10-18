import { LIMITS } from '@/lib/domain/members';
import { AppError, authorize, handler, json, readJson } from '@/lib/server/http';
import { insertPrize, listPrizes } from '@/lib/server/repo';
import { prizeFields } from '@/lib/validation';

// Prizes on the wheel of fortune (parents only).
export const POST = handler(async (req, _route, { db, actor }) => {
  authorize(await actor(), { action: 'prizes.manage' });
  const input = await readJson(req, prizeFields);
  if ((await listPrizes(db)).length >= LIMITS.prizes) throw new AppError('too_many', 409);
  return json({ prize: await insertPrize(db, input) }, 201);
});
