import { describe, expect, it } from 'vitest';
import { CMP, compare } from './compare';

describe('compare', () => {
  it('returns nothing for zero', () => expect(compare(0, 1)).toBeNull());

  it('says "times" for long swims', () => {
    const c = compare(500, 3);
    expect(c?.kind).toBe('times');
    if (c?.kind === 'times') expect(c.times).toBe(Math.round((500 / c.item.v) * 10) / 10);
  });

  it('says "almost exactly" or a percentage for mountains and lakes', () => {
    const rysy = CMP.findIndex((x) => x.v === 2500);
    // 2400 m: only Rysy (0.96×) and nearby peaks qualify; find a seed that picks Rysy.
    const results = Array.from({ length: 20 }, (_, s) => compare(2400, s)).filter((c) => c?.item === CMP[rysy]);
    expect(results[0]?.kind).toBe('almost');
    const pct = Array.from({ length: 20 }, (_, s) => compare(1500, s)).find((c) => c?.kind === 'pct');
    expect(pct?.kind === 'pct' && pct.pct).toBeGreaterThanOrEqual(50);
  });

  it('is deterministic for a seed', () => {
    expect(compare(750, 1_760_000_000_123)).toEqual(compare(750, 1_760_000_000_123));
  });
});
