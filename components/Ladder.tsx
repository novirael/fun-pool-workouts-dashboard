'use client';

import type { Lake, Place } from '@/lib/domain/places';
import { mapUrl } from '@/lib/domain/route';
import { ladder, lengthsFor } from '@/lib/domain/stats';
import { useI18n } from '@/lib/i18n/context';

/** Current mountain or lake with the rope progress, plus the list of all of them. */
export default function LadderPanel({ items, total, kind, pool }: { items: (Place | Lake)[]; total: number; kind: 'peak' | 'lake'; pool: number }) {
  const { t, L, dist, dl, fmtNum } = useI18n();
  const pos = ladder(items, total);
  const label = (it: Place | Lake) => ('how' in it ? `${L(it.name)} ${L(it.how)}` : L(it.name));
  return (
    <div className="panel">
      {pos.all ? (
        <p className="peak">{t.ladder.allDone}</p>
      ) : (
        <>
          <p className="now">{kind === 'lake' ? t.ladder.nowLake : t.ladder.nowPeak}</p>
          <p className="peak">
            {label(pos.cur)}{' '}
            <span className="muted small">
              ({kind === 'lake' ? dist(pos.cur.v) : `${fmtNum(pos.cur.v)} m`}, {L(pos.cur.region)})
            </span>
          </p>
          <p style={{ margin: '2px 0 0' }}>
            <a className="maplink" href={mapUrl(pos.cur.q)} target="_blank" rel="noopener noreferrer">
              {t.ladder.showOnMap}
            </a>
          </p>
          <div className="rope">
            <i style={{ width: `${Math.min(100, (pos.into / pos.need) * 100).toFixed(1)}%` }} />
          </div>
          <p className="left">{t.ladder.left(dl(lengthsFor(pos.need - pos.into, pool)), pool, kind === 'peak')}</p>
        </>
      )}
      <div className="grid">
        {items.map((it, i) => (
          <span key={i} className={`pk ${i < pos.done ? 'done' : ''} ${i === pos.done && !pos.all ? 'cur' : ''}`}>
            {i < pos.done ? '✓ ' : ''}
            {label(it)}
          </span>
        ))}
      </div>
    </div>
  );
}
