import { handler, json } from '@/lib/server/http';
import { loadState } from '@/lib/server/repo';

// Everything the app needs in one request; all statistics are derived on the client.
export const GET = handler(async (_req, _route, { db }) => json(await loadState(db)));
