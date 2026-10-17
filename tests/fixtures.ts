import type { Member, PoolLength, Session } from '@/lib/domain/types';

// Made-up family for tests. Never use real names here: the repository is public.

let seq = 0;

export function member(over: Partial<Member> = {}): Member {
  seq++;
  return {
    id: `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`,
    name: `Swimmer ${seq}`,
    subtitle: '',
    role: 'child',
    swims: true,
    color: 'orange',
    avatar: '🦦',
    defaultLengths: 20,
    monthlyPaceM: 2500,
    recordGoalsM: [800, 1000, 1250, 1500],
    archived: false,
    ...over,
  };
}

export function session(swimmerId: string, date: string, lengths: number, pool: PoolLength = 25, ts = Date.parse(`${date}T12:00:00Z`)): Session {
  seq++;
  return { id: `s-${seq}`, swimmerId, createdBy: swimmerId, date, lengths, pool, ts };
}

/** One session per week starting on `start` (a date string), `weeks` times. */
export function weekly(swimmerId: string, start: string, weeks: number, lengths = 20, pool: PoolLength = 25): Session[] {
  const out: Session[] = [];
  const d = new Date(`${start}T00:00:00Z`);
  for (let i = 0; i < weeks; i++) {
    out.push(session(swimmerId, d.toISOString().slice(0, 10), lengths, pool));
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return out;
}
