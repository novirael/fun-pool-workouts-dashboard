import { describe, expect, it } from 'vitest';
import { chanceOf, landingRotation, pickWeighted, totalWeight, wheelSegments } from './prizes';

const prizes = [
  { id: 'a', name: 'Lody', weight: 3 },
  { id: 'b', name: 'Kino', weight: 1 },
];

describe('prizes', () => {
  it('picks by weight', () => {
    expect(totalWeight(prizes)).toBe(4);
    expect([0, 1, 2, 3].map((t) => pickWeighted(prizes, t).id)).toEqual(['a', 'a', 'a', 'b']);
    expect(() => pickWeighted(prizes, 4)).toThrow(RangeError);
    expect(chanceOf(prizes[1]!, prizes)).toBe(0.25);
  });

  it('sizes wheel slices by chance', () => {
    const [a, b] = wheelSegments(prizes);
    expect(a).toMatchObject({ start: 0, end: 270, mid: 135 });
    expect(b).toMatchObject({ start: 270, end: 360, mid: 315 });
  });

  it('lands the chosen slice under the pointer after a few turns', () => {
    for (const seg of wheelSegments(prizes)) {
      for (const jitter of [-1, 0, 1]) {
        for (const from of [0, 123, 2400]) {
          const r = landingRotation(from, seg, jitter);
          expect(r).toBeGreaterThan(from + 360 * 5);
          // The point under the pointer (top) after rotating clockwise by r:
          const under = (((360 - (r % 360)) % 360) + 360) % 360;
          expect(under).toBeGreaterThanOrEqual(seg.start);
          expect(under).toBeLessThanOrEqual(seg.end);
        }
      }
    }
  });
});
