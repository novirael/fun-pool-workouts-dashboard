import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

// One shared family password (APP_PASSWORD). Devices keep a token, not the password:
// token = HMAC(AUTH_SECRET, "v1:" + password). It never expires, but changing the password
// (or the secret) invalidates every stored token, which makes each device ask again.

export interface AuthConfig {
  password: string;
  secret: string;
}

export function authConfig(): AuthConfig | null {
  const password = process.env.APP_PASSWORD?.trim();
  const secret = process.env.AUTH_SECRET;
  return password && secret ? { password, secret } : null;
}

const sha256 = (s: string) => createHash('sha256').update(s).digest();
// Kids type on iPads: ignore surrounding spaces and letter case.
const normalize = (s: string) => s.trim().toLowerCase();

/** Constant-time comparison of fixed-length digests, so neither content nor length leaks. */
const same = (a: string, b: string) => timingSafeEqual(sha256(a), sha256(b));

export const passwordMatches = (input: string, cfg: AuthConfig) => same(normalize(input), normalize(cfg.password));

export const issueToken = (cfg: AuthConfig) => createHmac('sha256', cfg.secret).update(`v1:${normalize(cfg.password)}`).digest('base64url');

export const tokenValid = (token: string | null, cfg: AuthConfig) => token !== null && same(token, issueToken(cfg));

export function bearerToken(req: Request): string | null {
  const m = req.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i);
  return m?.[1] ?? null;
}
