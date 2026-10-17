import { describe, expect, it } from 'vitest';
import { member } from '@/tests/fixtures';
import { can } from './permissions';

describe('permissions', () => {
  const parent = member({ role: 'parent' });
  const kid = member({ role: 'child' });
  const other = member({ role: 'child' });

  it('lets parents do everything', () => {
    expect(can(parent, { action: 'members.manage' })).toBe(true);
    expect(can(parent, { action: 'export' })).toBe(true);
    expect(can(parent, { action: 'awards.toggle' })).toBe(true);
    expect(can(parent, { action: 'avatar.change', memberId: kid.id })).toBe(true);
    expect(can(parent, { action: 'session.delete', session: { swimmerId: kid.id, createdBy: kid.id } })).toBe(true);
  });

  it('limits children to their own things', () => {
    expect(can(kid, { action: 'members.manage' })).toBe(false);
    expect(can(kid, { action: 'export' })).toBe(false);
    expect(can(kid, { action: 'awards.toggle' })).toBe(false);
    expect(can(kid, { action: 'session.create' })).toBe(true);
    expect(can(kid, { action: 'avatar.change', memberId: kid.id })).toBe(true);
    expect(can(kid, { action: 'avatar.change', memberId: other.id })).toBe(false);
    expect(can(kid, { action: 'session.delete', session: { swimmerId: kid.id, createdBy: parent.id } })).toBe(true);
    expect(can(kid, { action: 'session.delete', session: { swimmerId: other.id, createdBy: kid.id } })).toBe(true);
    expect(can(kid, { action: 'session.delete', session: { swimmerId: other.id, createdBy: parent.id } })).toBe(false);
  });

  it('denies everything without an actor', () => {
    expect(can(null, { action: 'session.create' })).toBe(false);
  });
});
