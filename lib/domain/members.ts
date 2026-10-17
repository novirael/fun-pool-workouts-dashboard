import { AVATARS } from './avatars';
import { COLORS, type ColorKey } from './palette';
import type { Member, Role } from './types';

export const LIMITS = {
  activeSwimmers: 6,
  members: 10,
  name: 20,
  subtitle: 30,
  lengths: 400,
  pace: [500, 50_000] as const,
  record: [50, 20_000] as const,
};

export const DEFAULT_GOALS = { defaultLengths: 20, monthlyPaceM: 3000, recordGoalsM: [1000, 1250, 1500, 2000] };

export type MemberDraft = Omit<Member, 'id' | 'archived'>;

/** A fresh form for a new family member, picking a color and animal nobody uses yet. */
export function newMemberDraft(existing: Member[], role: Role = 'child'): MemberDraft {
  const usedC = new Set(existing.map((m) => m.color)), usedA = new Set(existing.map((m) => m.avatar));
  const color: ColorKey = COLORS.find((c) => !usedC.has(c)) ?? COLORS[0];
  const avatar = AVATARS.find((a) => !usedA.has(a)) ?? AVATARS[0];
  return { name: '', subtitle: '', role, swims: true, color, avatar, ...DEFAULT_GOALS, recordGoalsM: [...DEFAULT_GOALS.recordGoalsM] };
}

/** Kids first, then parents; each group in creation order (the API returns members by creation time). */
export function sortMembers(list: Member[]): Member[] {
  return [...list.filter((m) => m.role === 'child'), ...list.filter((m) => m.role === 'parent')];
}

export const activeSwimmers = (list: Member[]) => sortMembers(list.filter((m) => m.swims && !m.archived));
