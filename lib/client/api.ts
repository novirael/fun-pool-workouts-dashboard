'use client';

import type { ApiErrorCode } from '@/lib/api-errors';
import { memberStore, tokenStore, updateStore } from './store';

export type ClientErrorCode = ApiErrorCode | 'rate_limited' | 'offline';

export class ApiError extends Error {
  constructor(
    readonly code: ClientErrorCode,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(code);
  }
}

const BUILD = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

export async function api<T>(path: string, { method = 'GET', body }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  const member = memberStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (member) headers['X-Member-Id'] = member;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
  } catch {
    throw new ApiError('offline', 0);
  }

  const server = res.headers.get('x-app-version');
  if (server && server !== BUILD && BUILD !== 'dev') updateStore.set(true);

  if (res.ok) return (await res.json()) as T;
  if (res.status === 429) throw new ApiError('rate_limited', 429);
  const data = (await res.json().catch(() => ({}))) as { error?: ApiErrorCode; details?: unknown };
  const code = data.error ?? 'server_error';
  // Only an explicit rejection logs the device out; network trouble never does.
  if (res.status === 401 && token) tokenStore.set(null);
  if (code === 'member_unknown') memberStore.set(null);
  throw new ApiError(code, res.status, data.details);
}

export async function login(password: string): Promise<void> {
  const { token } = await api<{ token: string }>('/api/auth', { method: 'POST', body: { password } });
  tokenStore.set(token);
  // Ask Safari to keep our storage (home-screen apps are exempt from eviction anyway).
  navigator.storage?.persist?.().catch(() => {});
}
