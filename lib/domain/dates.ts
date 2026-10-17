// Dates are local calendar days as 'YYYY-MM-DD' strings; arithmetic is done in UTC so DST never shifts a day.

export const pad = (n: number) => String(n).padStart(2, '0');

export function todayStr(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Today's date in a given IANA time zone (the server runs in UTC, the family in Europe/Warsaw). */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function parseD(s: string): Date {
  const [y = 0, m = 1, d = 1] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function fmtD(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Monday of the week containing the date. */
export function weekKey(s: string): string {
  const d = parseD(s);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return fmtD(d);
}

export function addDays(s: string, n: number): string {
  const d = parseD(s);
  d.setUTCDate(d.getUTCDate() + n);
  return fmtD(d);
}

export function isIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && fmtD(parseD(s)) === s;
}
