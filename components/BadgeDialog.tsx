'use client';

import { useEffect, useRef, useState } from 'react';
import { useResetSpin, useSpin, useStoreSpin, useToggleAward, type SpinResult } from '@/lib/client/queries';
import type { Badge } from '@/lib/domain/badges';
import { todayStr } from '@/lib/domain/dates';
import { can } from '@/lib/domain/permissions';
import { chanceOf, landingRotation, wheelSegments } from '@/lib/domain/prizes';
import { CONFETTI } from '@/lib/domain/palette';
import type { Award, Member, Prize, Spin } from '@/lib/domain/types';
import { useI18n } from '@/lib/i18n/context';
import { badgeDesc } from './badgeText';
import { errorText, toast } from './Toast';
import Wheel from './Wheel';

interface Props {
  badge: Badge;
  member: Member;
  me: Member;
  earnedOn: string;
  award?: Award;
  spin?: Spin;
  prizes: Prize[];
  onClose(): void;
  onFamily(): void;
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** An earned badge: spin the wheel of fortune for a prize, then a parent marks it as handed out. */
export default function BadgeDialog({ badge, member, me, earnedOn, award, spin, prizes, onClose, onFamily }: Props) {
  const i18n = useI18n();
  const { t, date, fmtNum } = i18n;
  const spinMutation = useSpin();
  const storeSpin = useStoreSpin();
  const reset = useResetSpin();
  const toggleAward = useToggleAward();
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'done'>('idle');
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Guards against finishing twice (transitionend and the fallback timer).
  const spinning = useRef(false);
  const duration = reducedMotion() ? 600 : 4600;

  const isParent = can(me, { action: 'awards.toggle' });
  const canSpin = can(me, { action: 'badge.spin', memberId: member.id });
  const wheelPrizes = result?.prizes ?? prizes;
  const shownSpin = phase === 'done' ? (result?.spin ?? spin) : phase === 'idle' ? spin : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && phase !== 'spinning' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, phase]);
  useEffect(() => () => clearTimeout(finishTimer.current), []);

  const fail = (e: unknown) => toast(errorText(t, e, t.common.saveFailed));

  function finish(res: SpinResult) {
    if (!spinning.current) return;
    spinning.current = false;
    clearTimeout(finishTimer.current);
    storeSpin(res.spin);
    setPhase('done');
  }

  function start() {
    spinMutation.mutate(
      { memberId: member.id, badgeId: badge.id },
      {
        onSuccess: (res) => {
          setResult(res);
          const seg = wheelSegments(res.prizes).find((s) => s.prize.id === res.spin.prizeId);
          if (!seg) {
            // Already drawn earlier and that prize was removed since: just show the result.
            storeSpin(res.spin);
            setPhase('done');
            return;
          }
          setRotation((r) => landingRotation(r, seg, Math.random() * 2 - 1));
          spinning.current = true;
          setPhase('spinning');
          finishTimer.current = setTimeout(() => finish(res), duration + 400);
        },
        onError: fail,
      },
    );
  }

  const markGiven = () =>
    toggleAward.mutate(
      { memberId: member.id, badgeId: badge.id, award: award ? null : { memberId: member.id, badgeId: badge.id, givenOn: todayStr(), givenBy: me.id } },
      { onError: fail },
    );

  const showWheel = phase !== 'idle' || (!spin && wheelPrizes.length > 0);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="bd-title" onClick={(e) => e.target === e.currentTarget && phase !== 'spinning' && onClose()}>
      <div className="cele bdlg" data-color={member.color}>
        <div className="nbh">
          <span className="e">{badge.e}</span>
          <div>
            <h3 id="bd-title" style={{ margin: 0 }}>
              {t.badges.names[badge.id]}
            </h3>
            <p className="now muted">
              {member.avatar} {member.name} · {t.profile.earnedOn(date(earnedOn, { day: 'numeric', month: 'long' }))}
            </p>
            <p className="small muted">{badgeDesc(i18n, badge, member)}</p>
          </div>
        </div>

        {showWheel && (
          <>
            <Wheel prizes={wheelPrizes} rotation={rotation} durationMs={phase === 'spinning' ? duration : 0} onStop={() => result && finish(result)} />
            {phase !== 'done' && !spin && (
              <>
                {canSpin ? (
                  <button className="ok" onClick={start} disabled={phase === 'spinning' || spinMutation.isPending}>
                    {phase === 'spinning' || spinMutation.isPending ? t.wheel.spinning : `🎡 ${t.wheel.spin}`}
                  </button>
                ) : (
                  <p className="center muted">{t.wheel.onlyOwner(member.name)}</p>
                )}
                <details className="chances">
                  <summary>{t.wheel.chances}</summary>
                  <ul>
                    {wheelPrizes.map((p) => (
                      <li key={p.id}>
                        {p.name} <span className="muted">{t.family.percent(fmtNum(chanceOf(p, wheelPrizes) * 100, 0))}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              </>
            )}
          </>
        )}

        {shownSpin && (
          <div className="won" role="status">
            <small>{t.wheel.won}</small>
            <b>{shownSpin.prizeName}</b>
          </div>
        )}

        {!shownSpin && !showWheel && (
          <div className="empty" style={{ margin: '14px 0' }}>
            <p style={{ fontSize: 36, margin: 0 }}>🎡</p>
            <p>{isParent ? t.wheel.emptyParent : t.wheel.empty}</p>
            {isParent && (
              <button className="btn ghost" onClick={onFamily}>
                {t.wheel.openSettings}
              </button>
            )}
          </div>
        )}

        {isParent && phase !== 'spinning' && (
          <div className="actions">
            <button className={`btn ${award ? 'ghost' : ''}`} onClick={markGiven} disabled={toggleAward.isPending}>
              {award ? t.wheel.undoGiven : t.wheel.markGiven}
            </button>
            {shownSpin && (
              <button
                className="btn ghost"
                onClick={() => {
                  setResult(null);
                  setPhase('idle');
                  reset.mutate({ memberId: member.id, badgeId: badge.id }, { onError: fail });
                }}
              >
                🎡 {t.wheel.respin}
              </button>
            )}
          </div>
        )}
        <button className="btn ghost wide" onClick={onClose} disabled={phase === 'spinning'}>
          {t.wheel.close}
        </button>
      </div>
      {phase === 'done' && result && <Confetti />}
    </div>
  );
}

function Confetti() {
  const [bits] = useState(() =>
    Array.from({ length: 28 }, (_, i) => ({ left: Math.random() * 100, delay: (Math.random() * 0.6).toFixed(2), color: CONFETTI[i % CONFETTI.length] })),
  );
  return bits.map((p, i) => <span key={i} className="conf" style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s` }} />);
}
