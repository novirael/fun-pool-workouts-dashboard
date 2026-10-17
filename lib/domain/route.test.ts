import { describe, expect, it } from 'vitest';
import { dirUrl, ROUTE, ROUTE_KM, routePos, stageOf, STAGES, stageStops } from './route';

describe('route', () => {
  it('starts and ends in Gostynin with every stage finish marked', () => {
    expect(ROUTE[0]!.km).toBe(0);
    expect(ROUTE[0]!.q).toBe('Gostynin');
    expect(ROUTE.at(-1)!.name.pl).toBe('Gostynin, dom!');
    expect(ROUTE.filter((s) => s.stage !== undefined).map((s) => s.stage)).toEqual([0, 1, 2, 3, 4]);
  });

  it('keeps the straight-line distances', () => {
    expect(ROUTE.map((s) => s.km)).toEqual([0, 8, 27, 41, 119, 193, 248, 267, 296, 504, 657, 846, 906, 997, 1075, 1140, 1224, 1293, 1384, 1462, 1559, 1615, 1691, 1813, 1899]);
    expect(ROUTE_KM).toBe(1899);
  });

  it('places the family between stops', () => {
    const a = ROUTE[1]!, b = ROUTE[2]!;
    const p = routePos(((a.km + b.km) / 2) * 1000);
    expect(p.done).toBe(false);
    expect(p.i).toBe(1);
    expect(p.frac).toBeCloseTo(0.5, 1);
    expect(p.next).toBe(b);
  });

  it('switches stage right after a stage finish', () => {
    const giz = ROUTE.findIndex((s) => s.stage === 0);
    expect(routePos(ROUTE[giz]!.km * 1000 - 1).stage).toBe(0);
    expect(routePos(ROUTE[giz]!.km * 1000).stage).toBe(1);
    expect(stageOf(giz + 1)).toBe(1);
  });

  it('is done at the end', () => {
    expect(routePos(ROUTE_KM * 1000)).toMatchObject({ done: true, next: null, stage: STAGES.length - 1 });
  });

  it('builds stage routes from the previous finish', () => {
    const s1 = stageStops(1);
    expect(s1[0]!.q).toBe('Giżycko');
    expect(s1.at(-1)!.q).toBe('Ustrzyki Górne');
    expect(dirUrl(s1)).toContain('origin=Gi%C5%BCycko%2C%20Polska');
  });
});
