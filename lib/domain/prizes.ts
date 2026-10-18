import type { Prize } from './types';

// Wheel of fortune: every prize gets a slice proportional to its weight.
// The server draws the winner; the client only animates the wheel to land on it.

export const totalWeight = (prizes: Pick<Prize, 'weight'>[]) => prizes.reduce((a, p) => a + p.weight, 0);

/** Chance of a prize, 0..1. */
export const chanceOf = (p: Pick<Prize, 'weight'>, prizes: Pick<Prize, 'weight'>[]) => {
  const t = totalWeight(prizes);
  return t ? p.weight / t : 0;
};

/** The prize hit by `ticket`, an integer in [0, totalWeight). The caller supplies the randomness. */
export function pickWeighted<T extends Pick<Prize, 'weight'>>(prizes: T[], ticket: number): T {
  let acc = 0;
  for (const p of prizes) {
    acc += p.weight;
    if (ticket < acc) return p;
  }
  throw new RangeError(`ticket ${ticket} is outside 0..${acc - 1}`);
}

export interface Segment<T> {
  prize: T;
  /** Degrees clockwise from the top (where the pointer is). */
  start: number;
  end: number;
  mid: number;
}

export function wheelSegments<T extends Pick<Prize, 'weight'>>(prizes: T[]): Segment<T>[] {
  const total = totalWeight(prizes);
  let at = 0;
  return prizes.map((prize) => {
    const span = total ? (prize.weight / total) * 360 : 0;
    const seg = { prize, start: at, end: at + span, mid: at + span / 2 };
    at += span;
    return seg;
  });
}

/**
 * Wheel rotation (degrees, clockwise) that brings `seg` under the pointer after a few full turns,
 * always further than `current`. `jitter` in [-1, 1] moves the landing point inside the slice.
 */
export function landingRotation(current: number, seg: Pick<Segment<unknown>, 'start' | 'end' | 'mid'>, jitter = 0, turns = 6): number {
  const target = seg.mid + (jitter * (seg.end - seg.start)) / 2 * 0.7;
  const base = Math.ceil(current / 360) * 360 + turns * 360;
  return base + ((360 - (target % 360)) % 360);
}
