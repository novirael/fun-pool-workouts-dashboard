import { LIMITS } from '@/lib/domain/members';
import { AppError, authorize, handler, json, readJson } from '@/lib/server/http';
import { countMembers, insertMember } from '@/lib/server/repo';
import { memberFields } from '@/lib/validation';

export const POST = handler(async (req, _route, { db, actor }) => {
  const input = await readJson(req, memberFields);
  const { total, activeSwimmers } = await countMembers(db);
  if (total === 0) {
    // First run: whoever sets the app up becomes the first parent; there is no actor yet.
    return json({ member: await insertMember(db, { ...input, role: 'parent' }) }, 201);
  }
  authorize(await actor(), { action: 'members.manage' });
  if (total >= LIMITS.members || (input.swims && activeSwimmers >= LIMITS.activeSwimmers)) throw new AppError('too_many', 409);
  return json({ member: await insertMember(db, input) }, 201);
});
