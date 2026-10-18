'use client';

import { useIsMutating } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { memberStore, updateStore, useStore } from '@/lib/client/store';
import { useSaveSessions } from '@/lib/client/queries';
import { uuid } from '@/lib/client/uuid';
import { celebrate, type Celebration } from '@/lib/domain/celebration';
import { todayStr } from '@/lib/domain/dates';
import { activeSwimmers, startLengths } from '@/lib/domain/members';
import { can } from '@/lib/domain/permissions';
import { byDateThenTs, POOL } from '@/lib/domain/stats';
import type { FamilyState, Member, PoolLength, Session } from '@/lib/domain/types';
import { useI18n } from '@/lib/i18n/context';
import CelebrationView from './CelebrationView';
import FamilySettings from './FamilySettings';
import LogView, { type Draft } from './LogView';
import ProfileView from './ProfileView';
import TabBar from './TabBar';
import { errorText, toast } from './Toast';
import TopBar from './TopBar';
import TripView from './TripView';
import WhoAmI from './WhoAmI';

const freshDraft = (me: Member | null, date: string): Draft => ({
  // The start screen: Training, with the current person's own card already switched on.
  on: me?.swims ? { [me.id]: true } : {},
  n: {},
  pool: {},
  date,
  datePicked: false,
  showDate: false,
});

export default function Main({ state, me }: { state: FamilyState; me: Member }) {
  const { t } = useI18n();
  const [tab, setTab] = useState('log');
  const [today, setToday] = useState(todayStr);
  const [draft, setDraft] = useState(() => freshDraft(me, todayStr()));
  const [touched, setTouched] = useState(false);
  const [cele, setCele] = useState<Celebration | null>(null);
  const [picking, setPicking] = useState(false);
  const save = useSaveSessions();
  const mutating = useIsMutating();
  const updateReady = useStore(updateStore);
  // Ids for the current draft, reused if saving is retried, so the server can deduplicate.
  const pending = useRef<{ key: string; ids: Record<string, string>; ts: number } | null>(null);

  const swimmers = useMemo(() => activeSwimmers(state.members), [state.members]);
  const activeMembers = useMemo(() => state.members.filter((m) => !m.archived), [state.members]);
  // Each swimmer's latest session overall (picks the pool) and per pool (picks the lengths).
  const last = useMemo(() => {
    const any = new Map<string, Session>(), inPool = new Map<string, Session>();
    for (const x of [...state.sessions].sort(byDateThenTs)) {
      any.set(x.swimmerId, x);
      inPool.set(`${x.swimmerId}:${x.pool}`, x);
    }
    return { any, inPool };
  }, [state.sessions]);

  const poolOf = (w: Member): PoolLength => draft.pool[w.id] ?? last.any.get(w.id)?.pool ?? POOL;
  const lengthsOf = (w: Member) => {
    const pool = poolOf(w);
    return draft.n[w.id] ?? last.inPool.get(`${w.id}:${pool}`)?.lengths ?? startLengths(w, pool);
  };
  const edit = useCallback((fn: (d: Draft) => Draft) => {
    setDraft(fn);
    setTouched(true);
  }, []);

  const showFamily = can(me, { action: 'members.manage' });
  const view = tab === 'log' || tab === 'trip' || (tab === 'family' && showFamily) || swimmers.some((s) => s.id === tab) ? tab : 'log';

  // Start at the top (after first-run setup or switching person the page may be scrolled).
  useEffect(() => window.scrollTo(0, 0), []);

  // Back in the foreground: the day may have changed while the iPad slept.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const d = todayStr();
      setToday(d);
      setDraft((dr) => (dr.datePicked ? dr : { ...dr, date: d }));
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // A newer version was deployed: reload as soon as nothing is in progress.
  const busy = touched || !!cele || picking || mutating > 0;
  useEffect(() => {
    if (updateReady && !busy) window.location.reload();
  }, [updateReady, busy]);

  function onSave() {
    const chosen = swimmers.filter((w) => draft.on[w.id] && lengthsOf(w) > 0);
    if (!chosen.length) return toast(t.log.pickSomeone);
    if (save.isPending) return;
    const key = JSON.stringify([draft.date, chosen.map((w) => [w.id, lengthsOf(w), poolOf(w)])]);
    if (pending.current?.key !== key) pending.current = { key, ids: Object.fromEntries(chosen.map((w) => [w.id, uuid()])), ts: Date.now() };
    const { ids, ts } = pending.current;
    const added: Session[] = chosen.map((w) => ({ id: ids[w.id]!, swimmerId: w.id, createdBy: me.id, date: draft.date, lengths: lengthsOf(w), pool: poolOf(w), ts }));
    const before = state.sessions;
    save.mutate(added, {
      onSuccess: () => {
        const addedIds = new Set(added.map((a) => a.id));
        const after = before.filter((x) => !addedIds.has(x.id)).concat(added);
        pending.current = null;
        setDraft((d) => {
          const keep = <V,>(r: Record<string, V>) => Object.fromEntries(Object.entries(r).filter(([k]) => !chosen.some((w) => w.id === k)));
          return { ...freshDraft(null, todayStr()), n: keep(d.n), pool: keep(d.pool) };
        });
        setTouched(false);
        setCele(celebrate(before, after, added, state.members, todayStr()));
      },
      onError: (e) => toast(errorText(t, e, t.common.saveFailed)),
    });
  }

  const goTab = (k: string) => {
    setTab(k);
    window.scrollTo(0, 0);
  };
  const profile = swimmers.find((s) => s.id === view);

  return (
    <>
      <div className="app">
        <TopBar me={me} showFamily={showFamily && view !== 'family'} onSwitch={() => setPicking(true)} onFamily={() => goTab('family')} />
        {view === 'log' && (
          <LogView
            swimmers={swimmers}
            sessions={state.sessions}
            draft={draft}
            lengthsOf={lengthsOf}
            poolOf={poolOf}
            edit={edit}
            today={today}
            saving={save.isPending}
            onSave={onSave}
            onTrip={() => goTab('trip')}
          />
        )}
        {view === 'trip' && <TripView state={state} />}
        {view === 'family' && <FamilySettings members={state.members} prizes={state.prizes} me={me} onBack={() => goTab('log')} />}
        {profile && <ProfileView key={profile.id} member={profile} state={state} me={me} today={today} onFamily={() => goTab('family')} />}
      </div>
      <TabBar
        tabs={[
          { key: 'log', icon: '🏊', label: t.tabs.log },
          ...swimmers.map((w) => ({ key: w.id, icon: w.avatar, label: w.name })),
          { key: 'trip', icon: '🗺️', label: t.tabs.trip },
        ]}
        active={view}
        onTab={goTab}
      />
      {cele && <CelebrationView c={cele} hasPrizes={state.prizes.length > 0} onClose={() => setCele(null)} />}
      {picking && (
        <WhoAmI
          members={activeMembers}
          onPick={(id) => {
            setPicking(false);
            memberStore.set(id);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  );
}
