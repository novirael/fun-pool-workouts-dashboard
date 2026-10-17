import { parseD } from '@/lib/domain/dates';

export interface Format {
  fmtNum(x: number, dec?: number): string;
  /** "740 m", "1,25 km", "12,3 km" (Polish) / "1.25 km" (English). */
  dist(m: number): string;
  date(s: string, opts: Intl.DateTimeFormatOptions): string;
  list(items: string[]): string;
}

export function makeFormat(locale: string): Format {
  const fmtNum = (x: number, dec = 1) => x.toLocaleString(locale, { maximumFractionDigits: dec });
  return {
    fmtNum,
    dist: (m) => (m < 1000 ? `${Math.round(m)} m` : `${fmtNum(m / 1000, m < 10000 ? 2 : 1)} km`),
    date: (s, opts) => parseD(s).toLocaleDateString(locale, { timeZone: 'UTC', ...opts }),
    list: (items) => new Intl.ListFormat(locale, { type: 'conjunction' }).format(items),
  };
}
