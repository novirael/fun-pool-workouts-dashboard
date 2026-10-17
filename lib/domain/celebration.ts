import { BADGES, badgeOk, type Badge } from './badges';
import { compare, type Comparison } from './compare';
import { CLIMB, LAKES, type Lake, type Place } from './places';
import { ROUTE, type Stop } from './route';
import { familyTotal, ladder, lengthsFor, meters, statsFor } from './stats';
import type { Member, Session } from './types';

export interface SwimmerCelebration {
  session: Session;
  member: Member;
  meters: number;
  record: boolean;
  peaks: Place[];
  lakes: Lake[];
  badges: Badge[];
  next: { place: Place; lengthsLeft: number } | null;
  fact: Comparison | null;
}

export interface Celebration {
  swimmers: SwimmerCelebration[];
  familyMeters: number;
  passed: Stop[];
  stagesDone: number[];
}

/** What changed between `before` and `after` for the sessions just `added`. */
export function celebrate(before: Session[], after: Session[], added: Session[], members: Member[], today: string): Celebration {
  const swimmers: SwimmerCelebration[] = [];
  added.forEach((x, i) => {
    const member = members.find((w) => w.id === x.swimmerId);
    if (!member) return;
    const sb = statsFor(x.swimmerId, before, today), sa = statsFor(x.swimmerId, after, today), m = meters(x);
    const pb = ladder(CLIMB, sb.total).done, pa = ladder(CLIMB, sa.total).done;
    const lb = ladder(LAKES, sb.total).done, la = ladder(LAKES, sa.total).done;
    const nx = ladder(CLIMB, sa.total);
    swimmers.push({
      session: x,
      member,
      meters: m,
      record: sb.count > 0 && m > sb.best,
      peaks: CLIMB.slice(pb, pa),
      lakes: LAKES.slice(lb, la),
      badges: BADGES.filter((b) => badgeOk(b, sa, member) && !badgeOk(b, sb, member)),
      next: nx.all ? null : { place: nx.cur, lengthsLeft: lengthsFor(nx.need - nx.into, x.pool) },
      fact: compare(m, x.ts + i * 7),
    });
  });
  const famB = familyTotal(before), famA = familyTotal(after);
  const passed = ROUTE.filter((s) => s.km > 0 && s.km * 1000 > famB && s.km * 1000 <= famA);
  const stagesDone = passed.flatMap((s) => (s.stage !== undefined ? [s.stage] : []));
  return { swimmers, familyMeters: famA, passed, stagesDone };
}
