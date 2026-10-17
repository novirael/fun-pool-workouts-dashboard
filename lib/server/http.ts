import 'server-only';
import { z } from 'zod';
import type { ApiErrorCode } from '@/lib/api-errors';
import { can, type Permission } from '@/lib/domain/permissions';
import type { Member } from '@/lib/domain/types';
import { authConfig, bearerToken, tokenValid } from './auth';
import { getDb, type DB } from './db';
import { getMember } from './repo';

export const APP_VERSION = process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev';
export const MEMBER_HEADER = 'x-member-id';

export class AppError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(code);
  }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-App-Version': APP_VERSION } });
}

export const fail = (code: ApiErrorCode, status: number, details?: unknown) => json(details === undefined ? { error: code } : { error: code, details }, status);

export async function readJson<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError('bad_request', 400);
  }
  return schema.parse(body);
}

export interface Ctx {
  db: DB;
  /** The family member using this device (X-Member-Id). Required for every write. */
  actor(): Promise<Member>;
}

/** The acting member must exist and not be archived; otherwise the client asks "who's here?" again. */
export async function resolveActor(db: DB, req: Request): Promise<Member> {
  const id = req.headers.get(MEMBER_HEADER) ?? '';
  const m = z.uuid().safeParse(id).success ? await getMember(db, id) : null;
  if (!m || m.archived) throw new AppError('member_unknown', 403);
  return m;
}

export function authorize(actor: Member, p: Permission) {
  if (!can(actor, p)) throw new AppError('forbidden', 403);
}

async function withErrors(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof AppError) return fail(e.code, e.status, e.details);
    if (e instanceof z.ZodError) return fail('validation', 400, e.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
    console.error(e);
    return fail('server_error', 500);
  }
}

/** A route that needs no token (only the password exchange). */
export const publicHandler = (fn: (req: Request) => Promise<Response>) => (req: Request) => withErrors(() => fn(req));

/** Wraps a data route: token check, DB access, and uniform error responses. */
export function handler<R>(fn: (req: Request, route: R, ctx: Ctx) => Promise<Response>) {
  return (req: Request, route: R): Promise<Response> =>
    withErrors(async () => {
      const cfg = authConfig();
      if (!cfg) return fail('not_configured', 500);
      if (!tokenValid(bearerToken(req), cfg)) return fail('unauthorized', 401);
      const db = await getDb();
      let actor: Promise<Member> | undefined;
      return fn(req, route, { db, actor: () => (actor ??= resolveActor(db, req)) });
    });
}
