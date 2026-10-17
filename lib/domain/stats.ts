import { addDays, weekKey } from './dates';
import type { PoolLength, Session } from './types';

export const POOL: PoolLength = 25;
export const POOLS: PoolLength[] = [15, 25];

export const meters = (x: { lengths: number; pool: number }) => x.lengths * x.pool;
export const lengthsFor = (m: number, pool: number = POOL) => Math.max(1, Math.ceil(m / pool));

export type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';
export const SEASONS: SeasonKey[] = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_OF: Record<string, SeasonKey> = {
  '12': 'winter', '01': 'winter', '02': 'winter',
  '03': 'spring', '04': 'spring', '05': 'spring',
  '06': 'summer', '07': 'summer', '08': 'summer',
};
export const seasonOf = (mm: string): SeasonKey => SEASON_OF[mm] ?? 'autumn';

/** Chronological order: by day, then by creation time. */
export const byDateThenTs = (a: Session, b: Session) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.ts - b.ts);

export interface Stats {
  id: string;
  sessions: Session[];
  count: number;
  total: number;
  lengthsSum: number;
  lastPool: PoolLength;
  best: number;
  bestStreak: number;
  /** Weeks in a row up to this week, or up to last week if this week has no swim yet. */
  cur: number;
  months: number;
  seasons: number;
  seasonSet: Set<SeasonKey>;
}

export function statsFor(id: string, list: Session[], today: string): Stats {
  const s = list.filter((x) => x.swimmerId === id).sort(byDateThenTs);
  const total = s.reduce((a, x) => a + meters(x), 0);
  const lengthsSum = s.reduce((a, x) => a + x.lengths, 0);
  const lastPool = s.length ? s[s.length - 1]!.pool : POOL;
  const best = s.reduce((a, x) => Math.max(a, meters(x)), 0);
  const wk = [...new Set(s.map((x) => weekKey(x.date)))].sort();
  let bestStreak = 0, run = 0, prev: string | null = null;
  for (const k of wk) {
    run = prev && addDays(prev, 7) === k ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    prev = k;
  }
  const set = new Set(wk), thisW = weekKey(today);
  let probe: string | null = set.has(thisW) ? thisW : set.has(addDays(thisW, -7)) ? addDays(thisW, -7) : null;
  let cur = 0;
  while (probe && set.has(probe)) {
    cur++;
    probe = addDays(probe, -7);
  }
  const mset = new Set(s.map((x) => x.date.slice(5, 7)));
  const seasonSet = new Set([...mset].map(seasonOf));
  return { id, sessions: s, count: s.length, total, lengthsSum, lastPool, best, bestStreak, cur, months: mset.size, seasons: seasonSet.size, seasonSet };
}

export const familyTotal = (list: Session[]) => list.reduce((a, x) => a + meters(x), 0);

export type LadderPos<T> = { all: false; done: number; cur: T; into: number; need: number } | { all: true; done: number };

export function ladder<T extends { v: number }>(items: T[], total: number): LadderPos<T> {
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    const it = items[i]!;
    if (total < acc + it.v) return { all: false, done: i, cur: it, into: total - acc, need: it.v };
    acc += it.v;
  }
  return { all: true, done: items.length };
}
