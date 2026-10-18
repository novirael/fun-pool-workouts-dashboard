'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useDeleteSession, useSetAvatar } from '@/lib/client/queries';
import { AVATARS } from '@/lib/domain/avatars';
import { BADGES, badgeDates, badgeHave, badgeNeed } from '@/lib/domain/badges';
import { can } from '@/lib/domain/permissions';
import { LAKES, PHASES, type PhaseId } from '@/lib/domain/places';
import { ladder, lengthsFor, meters, SEASONS, statsFor, type Stats } from '@/lib/domain/stats';
import type { FamilyState, Member } from '@/lib/domain/types';
import { useI18n } from '@/lib/i18n/context';
import BadgeDialog from './BadgeDialog';
import { badgeDesc } from './badgeText';
import LadderPanel from './Ladder';
import { errorText, toast } from './Toast';

interface Props {
  member: Member;
  state: FamilyState;
  me: Member;
  today: string;
  onFamily(): void;
}

export default function ProfileView({ member, state, me, today, onFamily }: Props) {
  const i18n = useI18n();
  const { t, dist, dl, date } = i18n;
  const [pickAv, setPickAv] = useState(false);
  const [armed, setArmed] = useState<string | null>(null);
  const setAvatar = useSetAvatar();
  const [openBadge, setOpenBadge] = useState<string | null>(null);
  const del = useDeleteSession();

  const s = useMemo(() => statsFor(member.id, state.sessions, today), [member.id, state.sessions, today]);
  const got = useMemo(() => badgeDates(member, s.sessions), [member, s.sessions]);
  const given = useMemo(() => new Map(state.awards.filter((a) => a.memberId === member.id).map((a) => [a.badgeId, a])), [state.awards, member.id]);
  const spins = useMemo(() => new Map(state.spins.filter((x) => x.memberId === member.id).map((x) => [x.badgeId, x])), [state.spins, member.id]);
  const names = useMemo(() => new Map(state.members.map((m) => [m.id, m.name])), [state.members]);

  // A pressed "Delete" disarms itself after a moment.
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(null), 4000);
    return () => clearTimeout(id);
  }, [armed]);

  const canAvatar = can(me, { action: 'avatar.change', memberId: member.id });
  const canGive = can(me, { action: 'awards.toggle' });

  const hero = (
    <>
      <div className="hero">
        {canAvatar ? (
          <button className="av" onClick={() => setPickAv(!pickAv)} aria-label={t.profile.changeAnimal} aria-expanded={pickAv}>
            {member.avatar}
          </button>
        ) : (
          <span className="av">{member.avatar}</span>
        )}
        <div>
          <h1>{member.name}</h1>
          <span className="muted">{member.subtitle}</span>
        </div>
      </div>
      {pickAv && (
        <>
          <p className="small muted" style={{ margin: '8px 0 0' }}>
            {t.profile.pickAnimal}
          </p>
          <div className="avpick">
            {AVATARS.map((e) => (
              <button
                key={e}
                aria-pressed={member.avatar === e}
                onClick={() => {
                  setPickAv(false);
                  setAvatar.mutate({ id: member.id, avatar: e }, { onError: (err) => toast(errorText(t, err, t.common.saveFailed)) });
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );

  if (!s.count) {
    return (
      <div data-color={member.color}>
        {hero}
        <div className="empty" style={{ marginTop: 18 }}>
          <p style={{ fontSize: 40, margin: 0 }}>🏊</p>
          <p>
            {t.profile.empty1}
            <br />
            {t.profile.empty2}
          </p>
        </div>
      </div>
    );
  }

  // Mountains: our peaks, then the Polish crown, then the Seven Summits; show the phase in progress.
  let rem = s.total;
  let mountains: ReactNode = null;
  const finished: { id: PhaseId; n: number }[] = [];
  for (const ph of PHASES) {
    const sum = ph.items.reduce((a, p) => a + p.v, 0);
    if (rem >= sum) {
      finished.push({ id: ph.id, n: ph.items.length });
      rem -= sum;
      continue;
    }
    mountains = (
      <>
        <h2>
          {t.profile.phases[ph.id]}{' '}
          <span className="muted small">
            {ladder(ph.items, rem).done}/{ph.items.length}
          </span>
        </h2>
        <LadderPanel items={ph.items} total={rem} kind="peak" pool={s.lastPool} />
      </>
    );
    break;
  }

  const earned = BADGES.filter((b) => got[b.id]);
  const toGive = earned.filter((b) => !given.has(b.id)).length;

  return (
    <div data-color={member.color}>
      <div className="ptop">
        <div>
          {hero}
          <p className="big">{dist(s.total)}</p>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            {t.profile.ofPool(dl(s.lengthsSum))}
          </p>
          <div className="trio">
            <div>
              <b>{s.count}</b>
              <span>{t.units.sessions(s.count)}</span>
            </div>
            <div>
              <b>{dist(s.best)}</b>
              <span>{t.profile.bestSession}</span>
            </div>
            <div>
              <b>
                {s.cur}
                {s.cur ? ' 🔥' : ''}
              </b>
              <span>{t.profile.inARow(t.units.weeks(s.cur))}</span>
            </div>
          </div>
        </div>
        <div>
          <NextBadge s={s} got={got} member={member} />
        </div>
      </div>

      <div className="cols">
        <div>
          {finished.map((f) => (
            <p key={f.id} className="small muted" style={{ margin: '18px 0 0' }}>
              {t.profile.phaseDone(t.profile.phases[f.id], f.n)}
            </p>
          ))}
          {mountains}
        </div>
        <div>
          <h2>
            {t.profile.lakes}{' '}
            <span className="muted small">
              {ladder(LAKES, s.total).done}/{LAKES.length}
            </span>
          </h2>
          <LadderPanel items={LAKES} total={s.total} kind="lake" pool={s.lastPool} />
        </div>
      </div>

      <h2>
        {t.profile.badgesTitle}{' '}
        <span className="muted small">
          {earned.length}/{BADGES.length}
          {toGive ? ` · ${t.profile.toGive(toGive)}` : ''}
        </span>
      </h2>
      {earned.length > 0 && (
        <p className="small muted" style={{ margin: '-4px 0 10px' }}>
          {canGive ? t.profile.giveHint : t.profile.giveHintKid}
        </p>
      )}
      <div className="badges">
        {BADGES.map((b) => {
          const d = got[b.id];
          const name = t.badges.names[b.id] ?? b.id;
          if (!d)
            return (
              <div key={b.id} className="bd off">
                <span className="e">{b.e}</span>
                {name}
                <small>{badgeDesc(i18n, b, member)}</small>
              </div>
            );
          const g = given.get(b.id), sp = spins.get(b.id);
          const label = g ? (sp ? t.profile.prizeGiven(sp.prizeName) : t.profile.given) : sp ? t.profile.prizeToGive(sp.prizeName) : t.profile.toGiveOne;
          // Tapping an earned badge opens the wheel of fortune (and, for parents, "handed out").
          return (
            <button key={b.id} className={`bd ${g ? 'given' : 'gift'}`} onClick={() => setOpenBadge(b.id)} aria-haspopup="dialog">
              <span className="e">{b.e}</span>
              {name}
              <small>{t.profile.earnedOn(date(d, { day: 'numeric', month: 'short' }))}</small>
              <em>{label}</em>
            </button>
          );
        })}
      </div>

      {openBadge && got[openBadge] && (
        <BadgeDialog
          badge={BADGES.find((b) => b.id === openBadge)!}
          member={member}
          me={me}
          earnedOn={got[openBadge]!}
          award={given.get(openBadge)}
          spin={spins.get(openBadge)}
          prizes={state.prizes}
          onClose={() => setOpenBadge(null)}
          onFamily={() => {
            setOpenBadge(null);
            onFamily();
          }}
        />
      )}

      <h2>{t.profile.history}</h2>
      <ul className="hist">
        {s.sessions
          .slice()
          .reverse()
          .slice(0, 20)
          .map((x) => {
            const deletable = can(me, { action: 'session.delete', session: x });
            const by = x.createdBy !== x.swimmerId ? names.get(x.createdBy) : undefined;
            return (
              <li key={x.id}>
                <span className="d">{date(x.date, { day: 'numeric', month: 'short' })}</span>
                <span className="l">
                  {dl(x.lengths)} <span className="muted">({dist(meters(x))})</span>
                  <small>
                    {t.profile.poolLabel[x.pool]}
                    {by && ` · ✍️ ${t.profile.addedBy(by)}`}
                  </small>
                </span>
                {deletable && (
                  <button
                    className={armed === x.id ? 'arm' : ''}
                    onClick={() => {
                      if (armed !== x.id) return setArmed(x.id);
                      setArmed(null);
                      del.mutate(x.id, { onError: (err) => toast(errorText(t, err, t.common.deleteFailed)) });
                    }}
                  >
                    {armed === x.id ? t.common.sure : t.common.delete}
                  </button>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
}

function NextBadge({ s, got, member }: { s: Stats; got: Record<string, string>; member: Member }) {
  const i18n = useI18n();
  const { t, dist, dl } = i18n;
  const b = BADGES.find((x) => !got[x.id]);
  if (!b)
    return (
      <>
        <h2>{t.badges.allTitle}</h2>
        <div className="panel">
          <p className="peak">{t.badges.allDone}</p>
        </div>
      </>
    );
  const need = badgeNeed(b, member), left = t.badges.left;
  let have = badgeHave(b, s), txt: string;
  switch (b.k) {
    case 'dist': {
      const rest = need - s.total, n = Math.max(1, Math.ceil(rest / (s.total / s.count)));
      txt = left.dist(dist(rest), n);
      break;
    }
    case 'count':
      txt = left.count(need - s.count);
      break;
    case 'streak':
      have = s.cur;
      txt = left.streak(s.cur);
      break;
    case 'best':
      txt = left.best(dist(s.best), dl(lengthsFor(need, 25)), dl(lengthsFor(need, 15)));
      break;
    case 'seasons':
      txt = left.seasons(i18n.list(SEASONS.filter((x) => !s.seasonSet.has(x)).map((x) => t.seasons[x])));
      break;
    case 'months':
      txt = left.months(s.months);
      break;
  }
  return (
    <>
      <h2>{t.badges.nextTitle}</h2>
      <div className="panel nextb">
        <div className="nbh">
          <span className="e">{b.e}</span>
          <div>
            <p className="peak">{t.badges.names[b.id]}</p>
            <p className="now">{badgeDesc(i18n, b, member)}</p>
          </div>
        </div>
        <div className="rope">
          <i style={{ width: `${Math.min(100, (have / need) * 100).toFixed(1)}%` }} />
        </div>
        <p className="left">{txt}</p>
      </div>
    </>
  );
}
