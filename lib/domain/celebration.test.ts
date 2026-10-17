import { describe, expect, it } from 'vitest';
import { member, session, weekly } from '@/tests/fixtures';
import { celebrate } from './celebration';
import { NASZE } from './places';
import { ROUTE } from './route';

describe('celebrate', () => {
  const a = member({ recordGoalsM: [800, 1000, 1250, 1500] });

  it('reports record, peaks, lakes, badges and the next peak', () => {
    const before = weekly(a.id, '2026-01-05', 3, 40); // 1000 m each
    const added = [session(a.id, '2026-01-26', 50)]; // 1250 m, 4th week in a row
    const c = celebrate(before, [...before, ...added], added, [a], '2026-01-26');
    const x = c.swimmers[0]!;
    expect(x.meters).toBe(1250);
    expect(x.record).toBe(true);
    // 3000 m → 4250 m passes the 3rd of our peaks (cumulative 3603 m) and Lake Zdworskie across (3192 m).
    expect(x.peaks.map((p) => p.name.pl)).toEqual([NASZE[2]!.name.pl]);
    expect(x.lakes.map((l) => `${l.name.pl} ${l.how.pl}`)).toEqual(['Jezioro Zdworskie wszerz']);
    // Silver (1000 m) was already earned; gold (1250 m) is new.
    expect(x.badges.map((b) => b.id).sort()).toEqual(['rek3', 'seria4']);
    expect(x.next?.place.name.pl).toBe(NASZE[3]!.name.pl);
    expect(x.fact).not.toBeNull();
  });

  it('is not a record on the first session', () => {
    const added = [session(a.id, '2026-01-05', 40)];
    expect(celebrate([], added, added, [a], '2026-01-05').swimmers[0]!.record).toBe(false);
  });

  it('lists route stops passed by the whole family', () => {
    const b = member();
    const firstStop = ROUTE[1]!.km * 1000;
    const before = [session(a.id, '2026-01-05', Math.floor((firstStop - 100) / 25))];
    const added = [session(b.id, '2026-01-06', 20)];
    const c = celebrate(before, [...before, ...added], added, [a, b], '2026-01-06');
    expect(c.passed.map((s) => s.q)).toEqual([ROUTE[1]!.q]);
    expect(c.stagesDone).toEqual([]);
    expect(c.familyMeters).toBe(before[0]!.lengths * 25 + 500);
  });
});
