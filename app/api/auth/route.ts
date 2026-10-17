import { authConfig, issueToken, passwordMatches } from '@/lib/server/auth';
import { fail, json, publicHandler, readJson } from '@/lib/server/http';
import { passwordInput } from '@/lib/validation';

const FAILED_DELAY_MS = 800;

// Exchanges the family password for a device token. Brute force is additionally limited by a
// Vercel WAF rate-limit rule on this path.
export const POST = publicHandler(async (req) => {
  const cfg = authConfig();
  if (!cfg) return fail('not_configured', 500);
  const { password } = await readJson(req, passwordInput);
  if (!passwordMatches(password, cfg)) {
    await new Promise((r) => setTimeout(r, FAILED_DELAY_MS));
    return fail('invalid_password', 401);
  }
  return json({ token: issueToken(cfg) });
});
