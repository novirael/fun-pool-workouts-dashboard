import type { Member, Session } from './types';

// Honor-system roles: everyone shares one password, so these rules prevent accidents, not attacks.
// The same function drives the UI and is enforced by the API.

type Actor = Pick<Member, 'id' | 'role'>;

export type Permission =
  | { action: 'members.manage' }
  | { action: 'export' }
  | { action: 'awards.toggle' }
  | { action: 'prizes.manage' }
  /** Spin the wheel for an earned badge: the badge owner or a parent. */
  | { action: 'badge.spin'; memberId: string }
  /** Throw away a wheel result so it can be spun again. */
  | { action: 'badge.respin' }
  | { action: 'avatar.change'; memberId: string }
  | { action: 'session.create' }
  | { action: 'session.delete'; session: Pick<Session, 'swimmerId' | 'createdBy'> };

export function can(actor: Actor | null | undefined, p: Permission): boolean {
  if (!actor) return false;
  if (actor.role === 'parent') return true;
  switch (p.action) {
    case 'session.create':
      return true;
    case 'avatar.change':
    case 'badge.spin':
      return p.memberId === actor.id;
    case 'session.delete':
      return p.session.swimmerId === actor.id || p.session.createdBy === actor.id;
    default:
      return false;
  }
}
