import { L, type Localized } from './types';

// Family trip from Gostynin, straight-line distances between stops.
export const STAGES: { name: Localized; e: string }[] = [
  { name: L('Mazury', 'Masuria'), e: '🏞️' },
  { name: L('Bieszczady'), e: '🦬' },
  { name: L('Tatry', 'Tatras'), e: '🏔️' },
  { name: L('Karkonosze', 'Giant Mountains'), e: '❄️' },
  { name: L('Powrót do Gostynina', 'Back to Gostynin'), e: '🌹' },
];

type RawStop = [pl: string, lat: number, lon: number, stage?: number, en?: string];

const ROUTE_RAW: RawStop[] = [
  ['Gostynin', 52.429, 19.462], ['Jezioro Lucieńskie', 52.497, 19.442, undefined, 'Lake Lucieńskie'],
  ['Jezioro Zdworskie', 52.42, 19.7, undefined, 'Lake Zdworskie'], ['Płock', 52.547, 19.706], ['Mława', 53.112, 20.384],
  ['Olsztyn', 53.778, 20.48], ['Mrągowo', 53.865, 21.305], ['Mikołajki', 53.802, 21.573], ['Giżycko', 54.038, 21.766, 0],
  ['Warszawa', 52.23, 21.012, undefined, 'Warsaw'], ['Lublin', 51.247, 22.568], ['Sanok', 49.556, 22.205], ['Ustrzyki Górne', 49.105, 22.65, 1],
  ['Krosno', 49.688, 21.77], ['Nowy Sącz', 49.625, 20.692], ['Zakopane', 49.299, 19.949, 2],
  ['Kraków', 50.062, 19.937], ['Katowice', 50.264, 19.024], ['Opole', 50.675, 17.921], ['Wrocław', 51.108, 17.038], ['Karpacz', 50.776, 15.756, 3],
  ['Legnica', 51.207, 16.155], ['Leszno', 51.842, 16.574], ['Konin', 52.223, 18.251], ['Gostynin', 52.429, 19.462, 4],
];

export function hav(a: RawStop, b: RawStop): number {
  const R = 6371, t = (x: number) => (x * Math.PI) / 180;
  const dla = t(b[1] - a[1]), dlo = t(b[2] - a[2]);
  const h = Math.sin(dla / 2) ** 2 + Math.cos(t(a[1])) * Math.cos(t(b[1])) * Math.sin(dlo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface Stop {
  name: Localized;
  /** Google Maps query (Polish place name). */
  q: string;
  km: number;
  /** Set on the last stop of a stage. */
  stage?: number;
}

export const ROUTE: Stop[] = (() => {
  let km = 0;
  return ROUTE_RAW.map((r, i) => {
    if (i) km += hav(ROUTE_RAW[i - 1]!, r);
    return { name: L(r[0], r[4]), q: r[0], km: Math.round(km), stage: r[3] };
  });
})();
ROUTE[ROUTE.length - 1]!.name = L('Gostynin, dom!', 'Gostynin, home!');

export const ROUTE_KM = ROUTE[ROUTE.length - 1]!.km;

export function stageOf(i: number): number {
  for (let k = i; k < ROUTE.length; k++) {
    const s = ROUTE[k]!.stage;
    if (s !== undefined) return s;
  }
  return STAGES.length - 1;
}

export function stageStops(k: number): Stop[] {
  const end = ROUTE.findIndex((r) => r.stage === k);
  const start = k === 0 ? 0 : ROUTE.findIndex((r) => r.stage === k - 1);
  return ROUTE.slice(start, end + 1);
}

export type RoutePos =
  | { done: false; i: number; frac: number; next: Stop; km: number; stage: number }
  | { done: true; i: number; frac: 0; next: null; km: number; stage: number };

export function routePos(m: number): RoutePos {
  const km = m / 1000;
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const a = ROUTE[i]!, b = ROUTE[i + 1]!;
    if (km < b.km) return { done: false, i, frac: (km - a.km) / (b.km - a.km), next: b, km, stage: stageOf(i + 1) };
  }
  return { done: true, i: ROUTE.length - 1, frac: 0, next: null, km, stage: STAGES.length - 1 };
}

const GM = 'https://www.google.com/maps/';
export const mapUrl = (q: string) => `${GM}search/?api=1&query=${encodeURIComponent(q)}`;
export const plq = (n: string) => `${n}, Polska`;

export function dirUrl(stops: Stop[]): string {
  const first = stops[0]!, last = stops[stops.length - 1]!;
  const w = stops.slice(1, -1).map((x) => plq(x.q)).join('|');
  return `${GM}dir/?api=1&origin=${encodeURIComponent(plq(first.q))}&destination=${encodeURIComponent(plq(last.q))}${
    w ? `&waypoints=${encodeURIComponent(w)}` : ''
  }&travelmode=driving`;
}
