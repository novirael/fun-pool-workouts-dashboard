import { AppError, authorize, handler, json, readJson } from '@/lib/server/http';
import { activeSwimmerIds, insertSessions } from '@/lib/server/repo';
import { sessionsCreate } from '@/lib/validation';

// Save one training for one or more swimmers. Ids come from the client, so retries are harmless.
export const POST = handler(async (req, _route, { db, actor }) => {
  const me = await actor();
  authorize(me, { action: 'session.create' });
  const { sessions } = await readJson(req, sessionsCreate);
  const ok = await activeSwimmerIds(db, sessions.map((s) => s.swimmerId));
  if (sessions.some((s) => !ok.has(s.swimmerId))) throw new AppError('validation', 400, [{ path: 'sessions', message: 'unknown_swimmer' }]);
  return json({ sessions: await insertSessions(db, sessions, me.id) }, 201);
});
