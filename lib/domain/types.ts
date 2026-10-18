import type { ColorKey } from './palette';

export type Lang = 'pl' | 'en';
export type Localized = Record<Lang, string>;

/** Localized text; English falls back to the Polish spelling (most proper names are the same). */
export const L = (pl: string, en: string = pl): Localized => ({ pl, en });

export type Role = 'parent' | 'child';
export type PoolLength = 15 | 25;

export interface Member {
  id: string;
  name: string;
  subtitle: string;
  role: Role;
  swims: boolean;
  color: ColorKey;
  avatar: string;
  /** Counter start for the small (15 m) and deep (25 m) pool, before any training in that pool. */
  defaultLengthsSmall: number;
  defaultLengthsDeep: number;
  /** Planned meters per month; distance badges are spaced by it. */
  monthlyPaceM: number;
  /** Bronze, silver, gold and master single-session record goals, in meters, ascending. */
  recordGoalsM: number[];
  archived: boolean;
}

export interface Session {
  id: string;
  swimmerId: string;
  createdBy: string;
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  lengths: number;
  pool: PoolLength;
  /** Creation time in epoch ms; orders sessions within a day and seeds the fun comparison. */
  ts: number;
}

export interface Award {
  memberId: string;
  badgeId: string;
  givenOn: string;
  givenBy: string;
}

/** A prize on the wheel of fortune; the chance of winning it is weight / sum of all weights. */
export interface Prize {
  id: string;
  name: string;
  weight: number;
}

/** The wheel result for one earned badge. One spin per badge; a parent can reset it. */
export interface Spin {
  memberId: string;
  badgeId: string;
  prizeId: string | null;
  /** Kept even if the prize is later removed from the list. */
  prizeName: string;
  spunBy: string;
  ts: number;
}

export interface FamilyState {
  members: Member[];
  sessions: Session[];
  awards: Award[];
  prizes: Prize[];
  spins: Spin[];
}
