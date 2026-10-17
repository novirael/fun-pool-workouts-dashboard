import { describe, expect, it } from 'vitest';
import { member, session, weekly } from '@/tests/fixtures';
import { BADGES, badgeDates, badgeNeed, badgeOk, type Goals } from './badges';
import { statsFor } from './stats';
import type { Session } from './types';

const byId = (id: string) => BADGES.find((b) => b.id === id)!;

/** The prototype's original algorithm: recompute all stats for every prefix. */
function badgeDatesNaive(g: Goals, swimmerId: string, all: Session[]) {
  const sorted = statsFor(swimmerId, all, '2100-01-01').sessions, got: Record<string, string> = {};
  for (let i = 0; i < sorted.length; i++) {
    const st = statsFor(swimmerId, sorted.slice(0, i + 1), '2100-01-01');
    for (const b of BADGES) if (!got[b.id] && badgeOk(b, st, g)) got[b.id] = sorted[i]!.date;
  }
  return got;
}

describe('badgeNeed', () => {
  const g = { monthlyPaceM: 2500, recordGoalsM: [800, 1000, 1250, 1500] };
  it('spaces distance badges by the monthly pace, rounded to 500 m', () => {
    expect(badgeNeed(byId('kijanka'), g)).toBe(5000);
    expect(badgeNeed(byId('krewetka'), g)).toBe(12500);
    expect(badgeNeed(byId('kijanka'), { ...g, monthlyPaceM: 3500 })).toBe(7000);
    expect(badgeNeed(byId('rybka'), { ...g, monthlyPaceM: 3333 })).toBe(23500); // 23331 → 23500
  });
  it('takes record goals by index and other thresholds as is', () => {
    expect(badgeNeed(byId('rek3'), g)).toBe(1250);
    expect(badgeNeed(byId('tr24'), g)).toBe(24);
    expect(badgeNeed(byId('seria12'), g)).toBe(12);
  });
});

describe('badgeDates', () => {
  const a = member({ monthlyPaceM: 2500 });

  it('awards the first badges on the right day', () => {
    // 20 lengths of 25 m = 500 m per week; "Kijanka" needs 5000 m → the 10th week.
    const list = weekly(a.id, '2026-01-05', 12);
    const got = badgeDates(a, statsFor(a.id, list, '2026-12-31').sessions);
    expect(got.seria4).toBe('2026-01-26');
    expect(got.kijanka).toBe('2026-03-09');
    expect(got.tr12).toBe('2026-03-23');
    expect(got.rek1).toBeUndefined(); // best 500 m < 800 m
  });

  it('matches the original algorithm on a messy history', () => {
    const list: Session[] = [];
    let ts = 0;
    // Irregular dates, both pools, gaps, several sessions on one day, two years.
    for (let i = 0; i < 160; i++) {
      const day = new Date(Date.UTC(2025, 0, 1 + Math.floor(i * 4.7) + (i % 5 === 0 ? 9 : 0)));
      list.push(session(a.id, day.toISOString().slice(0, 10), 10 + ((i * 7) % 45), i % 3 ? 25 : 15, ts++));
      if (i % 11 === 0) list.push(session(a.id, day.toISOString().slice(0, 10), 60, 25, ts++));
    }
    const fast = badgeDates(a, statsFor(a.id, list, '2100-01-01').sessions);
    expect(fast).toEqual(badgeDatesNaive(a, a.id, list));
    expect(Object.keys(fast).length).toBeGreaterThan(10);
  });
});
