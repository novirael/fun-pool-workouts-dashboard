import { addDays, weekKey } from './dates';
import { meters, seasonOf, type Stats } from './stats';
import type { Session } from './types';

// Badges are planned for roughly one per month with one training a week (counted as 4 a month, so missed weeks are fine).
// Distance and record goals are personal: they come from each swimmer's monthly pace and record goals.
export type BadgeKind = 'streak' | 'dist' | 'count' | 'best' | 'seasons' | 'months';

export interface Badge {
  id: string;
  e: string;
  k: BadgeKind;
  /** Months of pace for 'dist', record goal index for 'best', otherwise the raw threshold. */
  a: number;
}

const B = (id: string, e: string, k: BadgeKind, a: number): Badge => ({ id, e, k, a });

export const BADGES: Badge[] = [
  B('seria4', '🔥', 'streak', 4),
  B('kijanka', '🐸', 'dist', 2),
  B('tr12', '🎟️', 'count', 12),
  B('rek1', '🥉', 'best', 0),
  B('krewetka', '🦐', 'dist', 5),
  B('tr24', '⭐', 'count', 24),
  B('rybka', '🐠', 'dist', 7),
  B('seria12', '☄️', 'streak', 12),
  B('pory', '🍂', 'seasons', 4),
  B('rek2', '🥈', 'best', 1),
  B('osmiornica', '🐙', 'dist', 11),
  B('tr48', '🌟', 'count', 48),
  B('rok', '🗓️', 'months', 12),
  B('zolw', '🐢', 'dist', 14),
  B('foka', '🦭', 'dist', 15),
  B('seria26', '🌋', 'streak', 26),
  B('rek3', '🥇', 'best', 2),
  B('tr72', '💫', 'count', 72),
  B('pingwin', '🐧', 'dist', 19),
  B('delfin', '🐬', 'dist', 20),
  B('rekin', '🦈', 'dist', 21),
  B('wieloryb', '🐋', 'dist', 22),
  B('rek4', '🏆', 'best', 3),
  B('pletwal', '🐳', 'dist', 24),
  B('setka', '💯', 'count', 100),
];

export const BADGE_IDS = BADGES.map((b) => b.id);

export interface Goals {
  monthlyPaceM: number;
  recordGoalsM: number[];
}

export function badgeNeed(b: Badge, g: Goals): number {
  if (b.k === 'dist') return Math.round((g.monthlyPaceM * b.a) / 500) * 500;
  if (b.k === 'best') return g.recordGoalsM[b.a] ?? Infinity;
  return b.a;
}

type BadgeStats = Pick<Stats, 'total' | 'best' | 'count' | 'bestStreak' | 'seasons' | 'months'>;

export function badgeHave(b: Badge, s: BadgeStats): number {
  switch (b.k) {
    case 'dist': return s.total;
    case 'best': return s.best;
    case 'count': return s.count;
    case 'streak': return s.bestStreak;
    case 'seasons': return s.seasons;
    case 'months': return s.months;
  }
}

export const badgeOk = (b: Badge, s: BadgeStats, g: Goals) => badgeHave(b, s) >= badgeNeed(b, g);

/**
 * The day each badge was earned, replaying a swimmer's sessions in chronological order.
 * `sorted` must be one swimmer's sessions sorted by date, then ts (as `statsFor(...).sessions`).
 * Single pass; equivalent to recomputing statsFor on every prefix.
 */
export function badgeDates(g: Goals, sorted: Session[]): Record<string, string> {
  const got: Record<string, string> = {};
  const st: BadgeStats = { total: 0, best: 0, count: 0, bestStreak: 0, seasons: 0, months: 0 };
  const months = new Set<string>(), seasons = new Set<string>();
  let prevWeek: string | null = null, run = 0;
  for (const x of sorted) {
    const m = meters(x);
    st.total += m;
    st.best = Math.max(st.best, m);
    st.count++;
    const wk = weekKey(x.date);
    if (wk !== prevWeek) {
      run = prevWeek && addDays(prevWeek, 7) === wk ? run + 1 : 1;
      st.bestStreak = Math.max(st.bestStreak, run);
      prevWeek = wk;
    }
    const mm = x.date.slice(5, 7);
    months.add(mm);
    seasons.add(seasonOf(mm));
    st.months = months.size;
    st.seasons = seasons.size;
    for (const b of BADGES) if (!got[b.id] && badgeOk(b, st, g)) got[b.id] = x.date;
  }
  return got;
}
