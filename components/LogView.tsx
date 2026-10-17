'use client';

import { routePos, STAGES } from '@/lib/domain/route';
import { familyTotal, POOLS } from '@/lib/domain/stats';
import type { Member, PoolLength, Session } from '@/lib/domain/types';
import { useI18n } from '@/lib/i18n/context';
import { MIN_DATE } from '@/lib/validation';

export interface Draft {
  on: Record<string, boolean>;
  /** Explicit counter values; untouched swimmers follow their last session. */
  n: Record<string, number>;
  pool: Record<string, PoolLength>;
  date: string;
  datePicked: boolean;
  showDate: boolean;
}

interface Props {
  swimmers: Member[];
  sessions: Session[];
  draft: Draft;
  lengthsOf(w: Member): number;
  poolOf(w: Member): PoolLength;
  edit(fn: (d: Draft) => Draft): void;
  today: string;
  saving: boolean;
  onSave(): void;
  onTrip(): void;
}

export default function LogView({ swimmers, sessions, draft, lengthsOf, poolOf, edit, today, saving, onSave, onTrip }: Props) {
  const { t, date, dist, L } = useI18n();
  const dateLine = draft.date === today ? t.log.today(date(draft.date, { day: 'numeric', month: 'long' })) : date(draft.date, { weekday: 'long', day: 'numeric', month: 'long' });

  const m = familyTotal(sessions), p = routePos(m);
  const stage = STAGES[p.stage]!;

  return (
    <>
      <h1>{t.log.title}</h1>
      <p className="sub">
        {dateLine} &nbsp;
        <button className="datebtn" onClick={() => edit((d) => ({ ...d, showDate: !d.showDate }))}>
          {t.log.changeDate}
        </button>
      </p>
      {draft.showDate && (
        <p>
          <input
            type="date"
            aria-label={t.log.dateLabel}
            value={draft.date}
            min={MIN_DATE}
            max={today}
            onChange={(e) => {
              const v = e.target.value;
              // iOS ignores max and offers a "clear" button: clamp and ignore empty values.
              if (!v || v < MIN_DATE) return;
              const next = v > today ? today : v;
              edit((d) => ({ ...d, date: next, datePicked: next !== today, showDate: false }));
            }}
          />
        </p>
      )}

      <button className="banner" onClick={onTrip}>
        <span className="e">{p.done ? '🏠' : stage.e}</span>
        <div>
          <b>{t.log.familyFrom(dist(m))}</b>
          <span>{p.done ? t.log.tripDone : t.log.stageNext(L(stage.name), L(p.next.name))}</span>
        </div>
      </button>

      {swimmers.length === 0 ? (
        <div className="empty">{t.log.noSwimmers}</div>
      ) : (
        <div className="cards">
          {swimmers.map((w) => (
            <SwimmerCard
              key={w.id}
              w={w}
              on={!!draft.on[w.id]}
              n={lengthsOf(w)}
              pool={poolOf(w)}
              onToggle={() => edit((d) => ({ ...d, on: { ...d.on, [w.id]: !d.on[w.id] } }))}
              onInc={(by) => edit((d) => ({ ...d, n: { ...d.n, [w.id]: Math.max(0, Math.min(400, lengthsOf(w) + by)) } }))}
              onPool={(v) => edit((d) => ({ ...d, pool: { ...d.pool, [w.id]: v } }))}
            />
          ))}
        </div>
      )}

      <div className="savebar">
        <button onClick={onSave} disabled={saving}>
          {saving ? t.common.saving : t.log.save}
        </button>
      </div>
    </>
  );
}

interface CardProps {
  w: Member;
  on: boolean;
  n: number;
  pool: PoolLength;
  onToggle(): void;
  onInc(by: number): void;
  onPool(v: PoolLength): void;
}

function SwimmerCard({ w, on, n, pool, onToggle, onInc, onPool }: CardProps) {
  const { t, dist } = useI18n();
  return (
    <div className={`sc ${on ? 'on' : ''}`} data-color={w.color}>
      <button className="top" onClick={onToggle} aria-pressed={on}>
        <span className="av">{w.avatar}</span>
        <span className="nm">
          {w.name}
          <span>{on ? w.subtitle || ' ' : t.log.notSwimming}</span>
        </span>
        <span className="tick" aria-hidden="true">
          ✓
        </span>
      </button>
      {on && (
        <>
          <div className="counter">
            <button onClick={() => onInc(-5)} aria-label={t.log.minus(5)}>
              −5
            </button>
            <button onClick={() => onInc(-1)} aria-label={t.log.minus(1)}>
              −1
            </button>
            <div className="num" aria-live="polite">
              <b>{n}</b>
              <small>{t.log.equals(t.units.lengths(n), dist(n * pool))}</small>
            </div>
            <button className="plus" onClick={() => onInc(1)} aria-label={t.log.plus(1)}>
              +1
            </button>
            <button className="plus" onClick={() => onInc(5)} aria-label={t.log.plus(5)}>
              +5
            </button>
          </div>
          <div className="pools" role="group" aria-label={t.log.pools}>
            {POOLS.map((v) => (
              <button key={v} className={pool === v ? 'sel' : ''} onClick={() => onPool(v)} aria-pressed={pool === v}>
                {t.log.pool[v]} <b>{v}&nbsp;m</b>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
