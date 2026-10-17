import { L, type Localized } from './types';

export type Dim = 'height' | 'length' | 'width';

export interface CmpItem {
  v: number;
  dim: Dim;
  /** What is measured: Polish in genitive ("Pałacu Kultury"), English with article ("the Palace of Culture"). */
  of: Localized;
  /** Mountains and lakes may also be compared when the distance is a bit shorter. */
  m?: boolean;
}

export const CMP: CmpItem[] = [
  { v: 22, dim: 'height', of: L('Kolumny Zygmunta', "Sigismund's Column") },
  { v: 105, dim: 'length', of: L('boiska piłkarskiego', 'a football pitch') },
  { v: 212, dim: 'height', of: L('Sky Tower we Wrocławiu', 'the Sky Tower in Wrocław') },
  { v: 237, dim: 'height', of: L('Pałacu Kultury i Nauki', 'the Palace of Culture and Science') },
  { v: 310, dim: 'height', of: L('Varso Tower, najwyższego budynku w Unii Europejskiej', 'Varso Tower, the tallest building in the European Union') },
  { v: 862, dim: 'length', of: L('Morskiego Oka', 'Morskie Oko'), m: true },
  { v: 930, dim: 'width', of: L('Jeziora Lucieńskiego', 'Lake Lucieńskie'), m: true },
  { v: 1400, dim: 'width', of: L('Jeziora Zdworskiego', 'Lake Zdworskie'), m: true },
  { v: 1600, dim: 'width', of: L('Jeziora Mikołajskiego', 'Lake Mikołajskie'), m: true },
  { v: 1126, dim: 'height', of: L('Gubałówki', 'Gubałówka'), m: true },
  { v: 1346, dim: 'height', of: L('Tarnicy, najwyższego szczytu Bieszczadów', 'Tarnica, the highest peak of the Bieszczady'), m: true },
  { v: 1603, dim: 'height', of: L('Śnieżki', 'Śnieżka'), m: true },
  { v: 1894, dim: 'height', of: L('Giewontu', 'Giewont'), m: true },
  { v: 1987, dim: 'height', of: L('Kasprowego Wierchu', 'Kasprowy Wierch'), m: true },
  { v: 2500, dim: 'height', of: L('Rysów', 'Rysy'), m: true },
];

export type Comparison =
  | { kind: 'pct'; item: CmpItem; pct: number }
  | { kind: 'almost'; item: CmpItem }
  | { kind: 'times'; item: CmpItem; times: number };

/** A fun "that's N times the height of…" fact for a swim of `m` meters; `seed` picks among the candidates. */
export function compare(m: number, seed: number): Comparison | null {
  if (!m) return null;
  const c = CMP.filter((x) => {
    const r = m / x.v;
    return (r >= 1.15 && r <= 12) || (x.m && r >= 0.5 && r < 1.15);
  });
  if (!c.length) return null;
  const item = c[Math.abs(seed) % c.length]!, r = m / item.v;
  if (r < 0.9) return { kind: 'pct', item, pct: Math.round(r * 100) };
  if (r < 1.15) return { kind: 'almost', item };
  return { kind: 'times', item, times: r < 10 ? Math.round(r * 10) / 10 : Math.round(r) };
}
