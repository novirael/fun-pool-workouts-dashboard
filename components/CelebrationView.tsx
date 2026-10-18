'use client';

import { useEffect, useRef, useState } from 'react';
import type { Celebration } from '@/lib/domain/celebration';
import type { Comparison } from '@/lib/domain/compare';
import { CONFETTI } from '@/lib/domain/palette';
import { STAGES } from '@/lib/domain/route';
import { useI18n, type I18n } from '@/lib/i18n/context';

function factText({ t, L, fmtNum }: I18n, c: Comparison | null): string {
  if (!c) return '';
  const v = `${fmtNum(c.item.v)} m`, of = L(c.item.of);
  if (c.kind === 'pct') return t.compare.pct(c.pct, c.item.dim, of, v);
  if (c.kind === 'almost') return t.compare.almost(c.item.dim, of, v);
  return t.compare.times(c.times < 10 ? fmtNum(c.times) : String(c.times), c.item.dim, of, v);
}

export default function CelebrationView({ c, hasPrizes, onClose }: { c: Celebration; hasPrizes: boolean; onClose(): void }) {
  const i18n = useI18n();
  const { t, L, dist, dl } = i18n;
  const ok = useRef<HTMLButtonElement>(null);
  const [confetti] = useState(() =>
    Array.from({ length: 28 }, (_, i) => ({ left: Math.random() * 100, delay: (Math.random() * 0.6).toFixed(2), color: CONFETTI[i % CONFETTI.length] })),
  );

  useEffect(() => {
    // Focus for keyboards and screen readers, but keep the dialog scrolled to its title.
    ok.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="cele-title">
      <div className="cele">
        <h3 id="cele-title">{t.cele.title}</h3>
        {c.swimmers.map((x) => {
          const unlocked = [
            ...(x.record ? [t.cele.record] : []),
            ...x.peaks.map((p) => `⛰️ ${L(p.name)}`),
            ...x.lakes.map((l) => `🏞️ ${L(l.name)} ${L(l.how)}`),
          ];
          return (
            <div key={x.session.id} className="ce" data-color={x.member.color}>
              <span className="who">
                {x.member.avatar} {x.member.name}
              </span>
              <p className="m">{dist(x.meters)}</p>
              <p>
                {t.cele.inPool(dl(x.session.lengths), x.session.pool)} {factText(i18n, x.fact)}
              </p>
              {x.badges.map((b) => (
                <div key={b.id} className="newb">
                  <span className="e">{b.e}</span>
                  <div>
                    <small>{t.cele.newBadge}</small>
                    <b>{t.badges.names[b.id]}</b>
                  </div>
                </div>
              ))}
              {x.badges.length > 0 && hasPrizes && <p className="small">{t.cele.spinHint}</p>}
              {unlocked.length > 0 && (
                <div className="un">
                  {unlocked.map((u, i) => (
                    <span key={i}>{u}</span>
                  ))}
                </div>
              )}
              {x.next && <p className="small muted">{t.cele.toPeak(L(x.next.place.name), dl(x.next.lengthsLeft))}</p>}
            </div>
          );
        })}
        <div className="fam">
          {t.cele.family(dist(c.familyMeters))}
          {c.passed.length > 0 && (
            <>
              {' '}
              <b>{t.cele.reached(c.passed.map((s) => L(s.name)).join(', '))}</b>
            </>
          )}
          {c.stagesDone.length > 0 && (
            <>
              <br />
              <b>{c.stagesDone.map((k) => t.cele.stageDone(STAGES[k]!.e, L(STAGES[k]!.name))).join(' ')}</b>
            </>
          )}
        </div>
        <button ref={ok} className="ok" onClick={onClose}>
          {t.cele.ok}
        </button>
      </div>
      {confetti.map((p, i) => (
        <span key={i} className="conf" style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s` }} />
      ))}
    </div>
  );
}
