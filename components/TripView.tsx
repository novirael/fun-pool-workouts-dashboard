'use client';

import { activeSwimmers } from '@/lib/domain/members';
import { dirUrl, mapUrl, plq, ROUTE, ROUTE_KM, routePos, STAGES, stageStops } from '@/lib/domain/route';
import { familyTotal, lengthsFor } from '@/lib/domain/stats';
import type { FamilyState } from '@/lib/domain/types';
import { useI18n } from '@/lib/i18n/context';

const ROW = 58;

export default function TripView({ state }: { state: FamilyState }) {
  const { t, L, dist, dl } = useI18n();
  const m = familyTotal(state.sessions), p = routePos(m);
  const stage = STAGES[p.stage]!;
  const fin = p.done ? undefined : ROUTE.find((r, i) => i > p.i && r.stage === p.stage);
  // Current swimmers, plus anyone hidden since who still contributed meters.
  const active = activeSwimmers(state.members);
  const per = [...active, ...state.members.filter((w) => !active.includes(w))]
    .map((w) => ({ w, m: familyTotal(state.sessions.filter((x) => x.swimmerId === w.id)) }))
    .filter((x) => x.m > 0 || active.includes(x.w));
  const y = (p.i + p.frac) * ROW + 29;

  return (
    <div className="tripcols">
      <div>
        <h1>{t.trip.title}</h1>
        <p className="sub">{t.trip.sub}</p>
        <p className="big" style={{ ['--c' as string]: 'var(--water)' }}>
          {dist(m)} <small>{t.trip.ofKm(ROUTE_KM)}</small>
        </p>
        {p.done ? (
          <p>{t.trip.done}</p>
        ) : (
          <div className="panel" style={{ marginTop: 12 }}>
            <p className="now">{t.trip.stageOf(p.stage + 1, STAGES.length)}</p>
            <p className="peak">
              {stage.e} {L(stage.name)}
            </p>
            <p style={{ margin: '6px 0 0' }}>{t.trip.toStop(L(p.next.name), dist(p.next.km * 1000 - m), dl(lengthsFor(p.next.km * 1000 - m)))}</p>
            {fin && fin !== p.next && (
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {t.trip.stageFinish(L(fin.name), dist(fin.km * 1000 - m))}
              </p>
            )}
            <p style={{ margin: '10px 0 0' }}>
              <a className="mapbtn" href={dirUrl(stageStops(p.stage))} target="_blank" rel="noopener noreferrer">
                {t.trip.stageRoute}
              </a>
            </p>
          </div>
        )}

        {m > 0 && (
          <>
            <h2>{t.trip.who}</h2>
            <div className="stack">
              {per
                .filter((x) => x.m > 0)
                .map((x) => (
                  <i key={x.w.id} data-color={x.w.color} style={{ width: `${((x.m / m) * 100).toFixed(1)}%` }} />
                ))}
            </div>
            <div className="legend">
              {per.map((x) => (
                <span key={x.w.id} data-color={x.w.color}>
                  <i />
                  {x.w.avatar} {x.w.name}: <b>{dist(x.m)}</b>
                </span>
              ))}
            </div>
          </>
        )}

        <h2>{t.trip.stages}</h2>
        <div className="stagelinks">
          {STAGES.map((st, k) => {
            const ss = stageStops(k);
            return (
              <a key={k} className="stagelink" href={dirUrl(ss)} target="_blank" rel="noopener noreferrer">
                <span>{st.e}</span>
                <b>{L(st.name)}</b>
                <small>
                  {L(ss[0]!.name)} → {L(ss[ss.length - 1]!.name)}
                </small>
              </a>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="routeh">{t.trip.route}</h2>
        <div className="river">
          <div className="bed" />
          <div className="flow" style={{ height: Math.max(0, y - 29) }} />
          <span className="marker" style={{ top: y }}>
            🏊
          </span>
          {ROUTE.map((s, i) => (
            <div key={i} className={`stop ${i <= p.i ? 'past' : ''} ${s.stage !== undefined ? 'fin' : ''}`}>
              <span className="dot" />
              <a className="n" href={mapUrl(plq(s.q))} target="_blank" rel="noopener noreferrer">
                {s.stage !== undefined ? `${STAGES[s.stage]!.e} ` : ''}
                {L(s.name)}
                {s.stage !== undefined && <small>{t.trip.stageEnd(L(STAGES[s.stage]!.name))}</small>}
              </a>
              <span className="km">
                {s.km} km
                {i > 0 && (
                  <>
                    <br />
                    <a className="maplink" href={dirUrl([ROUTE[i - 1]!, s])} target="_blank" rel="noopener noreferrer">
                      {t.trip.leg}
                    </a>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
        <p className="note">{t.trip.note}</p>
      </div>
    </div>
  );
}
