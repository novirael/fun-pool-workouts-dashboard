import { describe, expect, it } from 'vitest';
import { member, session, weekly } from '@/tests/fixtures';
import { NASZE } from './places';
import { familyTotal, ladder, lengthsFor, meters, statsFor } from './stats';

describe('statsFor', () => {
  const a = member();

  it('sums distance, lengths, record and last pool', () => {
    const list = [session(a.id, '2026-09-01', 20, 25), session(a.id, '2026-09-08', 30, 15), session('other', '2026-09-08', 99)];
    const s = statsFor(a.id, list, '2026-09-10');
    expect(s.count).toBe(2);
    expect(s.total).toBe(20 * 25 + 30 * 15);
    expect(s.lengthsSum).toBe(50);
    expect(s.best).toBe(500);
    expect(s.lastPool).toBe(15);
  });

  it('orders sessions by date, then creation time', () => {
    const late = session(a.id, '2026-09-01', 10, 25, 2000);
    const early = session(a.id, '2026-09-01', 11, 25, 1000);
    const before = session(a.id, '2026-08-31', 12, 25, 9000);
    expect(statsFor(a.id, [late, early, before], '2026-09-01').sessions.map((x) => x.lengths)).toEqual([12, 11, 10]);
  });

  it('counts the best weekly streak, also across the new year', () => {
    const list = [...weekly(a.id, '2025-12-01', 6), session(a.id, '2026-02-02', 20)];
    const s = statsFor(a.id, list, '2026-02-03');
    expect(s.bestStreak).toBe(6);
    expect(s.cur).toBe(1);
  });

  it('keeps the current streak alive until the end of next week', () => {
    const list = weekly(a.id, '2026-09-07', 4); // Mondays, last one 2026-09-28
    expect(statsFor(a.id, list, '2026-09-28').cur).toBe(4);
    expect(statsFor(a.id, list, '2026-10-04').cur).toBe(4); // Sunday of the following week
    expect(statsFor(a.id, list, '2026-10-05').cur).toBe(4); // last week still counts
    expect(statsFor(a.id, list, '2026-10-12').cur).toBe(0); // a whole week missed
  });

  it('tracks months and seasons', () => {
    const list = ['2026-01-10', '2026-04-10', '2026-07-10', '2026-07-20', '2026-10-10'].map((d) => session(a.id, d, 10));
    const s = statsFor(a.id, list, '2026-10-11');
    expect(s.months).toBe(4);
    expect(s.seasons).toBe(4);
    expect([...s.seasonSet].sort()).toEqual(['autumn', 'spring', 'summer', 'winter']);
  });
});

describe('ladder', () => {
  it('finds the current item and progress', () => {
    const first = NASZE[0]!.v;
    expect(ladder(NASZE, 0)).toMatchObject({ all: false, done: 0, into: 0, need: first });
    expect(ladder(NASZE, first)).toMatchObject({ all: false, done: 1, into: 0 });
    expect(ladder(NASZE, first + 5)).toMatchObject({ done: 1, into: 5 });
    const sum = NASZE.reduce((x, p) => x + p.v, 0);
    expect(ladder(NASZE, sum)).toEqual({ all: true, done: NASZE.length });
  });
});

describe('helpers', () => {
  it('meters, lengthsFor and familyTotal', () => {
    expect(meters({ lengths: 4, pool: 15 })).toBe(60);
    expect(lengthsFor(51, 25)).toBe(3);
    expect(lengthsFor(0, 25)).toBe(1);
    expect(familyTotal([session('a', '2026-01-01', 2), session('b', '2026-01-01', 3, 15)])).toBe(95);
  });
});
