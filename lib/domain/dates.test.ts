import { describe, expect, it } from 'vitest';
import { addDays, isIsoDate, todayIn, todayStr, weekKey } from './dates';

describe('dates', () => {
  it('weekKey returns the Monday of the week', () => {
    expect(weekKey('2026-10-12')).toBe('2026-10-12'); // Monday
    expect(weekKey('2026-10-18')).toBe('2026-10-12'); // Sunday
    expect(weekKey('2026-01-01')).toBe('2025-12-29'); // across the year boundary
  });

  it('addDays is immune to DST changes', () => {
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-10-25', 7)).toBe('2026-11-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('todayStr uses the local calendar day', () => {
    expect(todayStr(new Date(2026, 9, 17, 23, 59))).toBe('2026-10-17');
  });

  it('todayIn uses the given zone', () => {
    const lateUtc = new Date('2026-10-17T22:30:00Z'); // already the 18th in Warsaw
    expect(todayIn('Europe/Warsaw', lateUtc)).toBe('2026-10-18');
    expect(todayIn('UTC', lateUtc)).toBe('2026-10-17');
  });

  it('isIsoDate rejects impossible dates', () => {
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-2-3')).toBe(false);
    expect(isIsoDate('nope')).toBe(false);
  });
});
