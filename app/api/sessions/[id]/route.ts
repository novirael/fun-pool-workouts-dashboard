import { z } from 'zod';
import { authorize, handler, json } from '@/lib/server/http';
import { deleteSession, getSession } from '@/lib/server/repo';

export const DELETE = handler(async (_req, route: RouteContext<'/api/sessions/[id]'>, { db, actor }) => {
  const me = await actor();
  const { id } = await route.params;
  const session = z.uuid().safeParse(id).success ? await getSession(db, id) : null;
  // Already gone counts as success, so a retried delete doesn't show an error.
  if (!session) return json({ ok: true });
  authorize(me, { action: 'session.delete', session });
  await deleteSession(db, session.id);
  return json({ ok: true });
});
