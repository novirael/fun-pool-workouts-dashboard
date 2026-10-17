import { authorize, handler, json } from '@/lib/server/http';
import { loadState } from '@/lib/server/repo';

// Full backup as JSON (parents only), offered as a download on the Family screen.
export const GET = handler(async (_req, _route, { db, actor }) => {
  authorize(await actor(), { action: 'export' });
  return json({ app: 'fun-pool-workouts-dashboard', version: 1, exportedAt: new Date().toISOString(), ...(await loadState(db)) });
});
