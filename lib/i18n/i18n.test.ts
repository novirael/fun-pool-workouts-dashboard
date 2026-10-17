import { describe, expect, it } from 'vitest';
import { BADGES } from '@/lib/domain/badges';
import { en } from './en';
import { makeFormat } from './format';
import { detectLocale } from './locale';
import { pl, plural } from './pl';

/** The prototype's hand-written Polish plural rule. */
function protoPl(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const d = n % 10, dd = n % 100;
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? few : many;
}

describe('Polish plurals', () => {
  it('match the prototype for 0..1000', () => {
    for (let n = 0; n <= 1000; n++) expect(plural(n, 'a', 'b', 'c')).toBe(protoPl(n, 'a', 'b', 'c'));
  });
  it('read naturally', () => {
    expect([1, 2, 5, 12, 22, 112].map((n) => `${n} ${pl.units.sessions(n)}`)).toEqual(['1 trening', '2 treningi', '5 treningów', '12 treningów', '22 treningi', '112 treningów']);
    expect(pl.badges.desc.streak(4)).toBe('Co tydzień przez 4 tygodnie');
    expect(en.units.lengths(1)).toBe('length');
    expect(en.units.lengths(2)).toBe('lengths');
  });
});

describe('dictionaries', () => {
  it('name every badge in both languages', () => {
    for (const b of BADGES) {
      expect(pl.badges.names[b.id], b.id).toBeTruthy();
      expect(en.badges.names[b.id], b.id).toBeTruthy();
    }
  });
  it('keep Polish grammar in comparisons', () => {
    expect(pl.compare.pct(80, 'height', 'Śnieżki', '1603 m')).toBe('To 80% wysokości Śnieżki (1603 m)!');
    expect(pl.compare.times('3,2', 'length', 'boiska piłkarskiego', '105 m')).toBe('To 3,2 razy długość boiska piłkarskiego (105 m)!');
    expect(en.compare.times('3.2', 'length', 'a football pitch', '105 m')).toBe('That’s 3.2 times the length of a football pitch (105 m)!');
  });
});

describe('format', () => {
  it('formats distances per locale', () => {
    const p = makeFormat('pl-PL'), e = makeFormat('en-GB');
    expect(p.dist(740)).toBe('740 m');
    expect(p.dist(1250)).toBe('1,25 km');
    expect(e.dist(1250)).toBe('1.25 km');
    expect(p.dist(12345)).toBe('12,3 km');
    expect(p.fmtNum(12345.6)).toBe('12 345,6');
  });
  it('formats dates without shifting the day', () => {
    expect(makeFormat('pl-PL').date('2026-10-17', { day: 'numeric', month: 'long' })).toBe('17 października');
    expect(makeFormat('en-GB').date('2026-10-17', { day: 'numeric', month: 'long' })).toBe('17 October');
  });
});

describe('detectLocale', () => {
  it('picks Polish or English by preference', () => {
    expect(detectLocale('pl-PL,pl;q=0.9,en;q=0.8')).toEqual({ lang: 'pl', format: 'pl-PL' });
    expect(detectLocale('en-US,en;q=0.9,pl;q=0.8')).toEqual({ lang: 'en', format: 'en-US' });
    expect(detectLocale('de-DE,de;q=0.9,pl;q=0.5')).toEqual({ lang: 'pl', format: 'pl-PL' });
    expect(detectLocale('en;q=0.4,pl;q=0.6')).toEqual({ lang: 'pl', format: 'pl-PL' });
    expect(detectLocale('pl')).toEqual({ lang: 'pl', format: 'pl-PL' });
  });
  it('falls back to English', () => {
    expect(detectLocale('de-DE,fr;q=0.5')).toEqual({ lang: 'en', format: 'en-GB' });
    expect(detectLocale(null)).toEqual({ lang: 'en', format: 'en-GB' });
    expect(detectLocale('garbage;;,,q=x')).toEqual({ lang: 'en', format: 'en-GB' });
  });
  it('honors an explicit override', () => {
    expect(detectLocale('en-US', 'pl')).toEqual({ lang: 'pl', format: 'pl-PL' });
    expect(detectLocale('pl-PL', 'xx').lang).toBe('pl');
  });
});
