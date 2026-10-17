import { z } from 'zod';
import { LIMITS } from '@/lib/domain/members';
import { AppError, authorize, handler, json, readJson } from '@/lib/server/http';
import { countMembers, countOtherParents, deleteMember, getMember, pgCode, updateMember } from '@/lib/server/repo';
import { memberPatch } from '@/lib/validation';

type Route = RouteContext<'/api/members/[id]'>;

async function target(route: Route) {
  const { id } = await route.params;
  return z.uuid().safeParse(id).success ? id : null;
}

export const PATCH = handler(async (req, route: Route, { db, actor }) => {
  const id = await target(route);
  const patch = await readJson(req, memberPatch);
  const me = await actor();
  const onlyAvatar = Object.keys(patch).every((k) => k === 'avatar');
  authorize(me, onlyAvatar ? { action: 'avatar.change', memberId: id ?? '' } : { action: 'members.manage' });

  const current = id ? await getMember(db, id) : null;
  if (!current) throw new AppError('not_found', 404);

  const next = { ...current, ...patch };
  const stopsBeingParent = current.role === 'parent' && !current.archived && (next.role !== 'parent' || next.archived);
  if (stopsBeingParent && (await countOtherParents(db, current.id)) === 0) throw new AppError('last_parent', 409);

  const becomesSwimmer = next.swims && !next.archived && !(current.swims && !current.archived);
  if (becomesSwimmer && (await countMembers(db)).activeSwimmers >= LIMITS.activeSwimmers) throw new AppError('too_many', 409);

  return json({ member: await updateMember(db, current.id, patch) });
});

export const DELETE = handler(async (_req, route: Route, { db, actor }) => {
  authorize(await actor(), { action: 'members.manage' });
  const id = await target(route);
  const current = id ? await getMember(db, id) : null;
  if (!current) throw new AppError('not_found', 404);
  if (current.role === 'parent' && !current.archived && (await countOtherParents(db, current.id)) === 0) throw new AppError('last_parent', 409);
  try {
    await deleteMember(db, current.id);
  } catch (e) {
    // Sessions or awards still point at this member (restrict / foreign-key violation): archive instead.
    const code = pgCode(e);
    if (code === '23001' || code === '23503') throw new AppError('in_use', 409);
    throw e;
  }
  return json({ ok: true });
});
