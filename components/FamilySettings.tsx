'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/client/api';
import { useCreateMember, useDeleteMember, useUpdateMember } from '@/lib/client/queries';
import { AVATARS } from '@/lib/domain/avatars';
import { todayStr } from '@/lib/domain/dates';
import { LIMITS, newMemberDraft, sortMembers, type MemberDraft } from '@/lib/domain/members';
import { COLORS } from '@/lib/domain/palette';
import type { Member, Prize } from '@/lib/domain/types';
import { useI18n } from '@/lib/i18n/context';
import { memberFields } from '@/lib/validation';
import PrizeSettings from './PrizeSettings';
import { errorText, toast } from './Toast';

interface Props {
  members: Member[];
  prizes?: Prize[];
  /** Absent during first-time setup, when nobody exists yet. */
  me?: Member;
  onBack?: () => void;
  onCreated?: (m: Member) => void;
}

export default function FamilySettings({ members, prizes = [], me, onBack, onCreated }: Props) {
  const { t } = useI18n();
  const onboarding = members.length === 0;
  const [editing, setEditing] = useState<'new' | string | null>(onboarding ? 'new' : null);
  const [armed, setArmed] = useState<string | null>(null);
  const update = useUpdateMember();
  const remove = useDeleteMember();

  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(null), 4000);
    return () => clearTimeout(id);
  }, [armed]);

  const active = sortMembers(members.filter((m) => !m.archived));
  const hidden = sortMembers(members.filter((m) => m.archived));
  const fail = (e: unknown) => toast(errorText(t, e, t.common.saveFailed));

  async function exportData() {
    try {
      const data = await api<unknown>('/api/export');
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: `swim-backup-${todayStr()}.json` });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      fail(e);
    }
  }

  const row = (m: Member) => (
    <li key={m.id} className="mrow" data-color={m.color}>
      <span className="av">{m.avatar}</span>
      <span className="nm">
        {m.name} {m.id === me?.id && <span className="muted small">{t.family.you}</span>}
        <small>
          {m.role === 'parent' ? t.family.parent : t.family.child} · {m.swims ? t.family.swims : t.family.notSwims}
          {m.subtitle && ` · ${m.subtitle}`}
        </small>
      </span>
      <span className="acts">
        {!m.archived && (
          <button className="btn ghost sm" onClick={() => setEditing(m.id)}>
            {t.family.edit}
          </button>
        )}
        <button className="btn ghost sm" onClick={() => update.mutate({ id: m.id, patch: { archived: !m.archived } }, { onError: fail })}>
          {m.archived ? t.family.restore : t.family.hide}
        </button>
        {m.archived && (
          <button
            className={`btn sm ${armed === m.id ? 'arm' : 'ghost'}`}
            onClick={() => {
              if (armed !== m.id) return setArmed(m.id);
              setArmed(null);
              remove.mutate(m.id, { onError: (e) => toast(errorText(t, e, t.common.deleteFailed)) });
            }}
          >
            {armed === m.id ? t.common.sure : t.common.delete}
          </button>
        )}
      </span>
    </li>
  );

  if (onboarding) {
    return (
      <main className="screen">
        <div className="card">
          <p className="lead" aria-hidden="true">
            🏊
          </p>
          <h1>{t.family.welcome}</h1>
          <p className="sub">{t.family.welcomeText}</p>
          <MemberForm existing={members} initial={newMemberDraft(members, 'parent')} lockParent onDone={(m) => m && onCreated?.(m)} />
        </div>
      </main>
    );
  }

  const target = editing && editing !== 'new' ? members.find((m) => m.id === editing) : undefined;

  return (
    <>
      {onBack && (
        <button className="datebtn" onClick={onBack} style={{ marginBottom: 8 }}>
          {t.common.back}
        </button>
      )}
      <h1>{t.family.title}</h1>
      <div className="famcols">
        <div>
          <ul className="mlist" style={{ marginTop: 14 }}>
            {active.map(row)}
          </ul>
          {editing === null && (
            <button className="btn wide" onClick={() => setEditing('new')} disabled={members.length >= LIMITS.members}>
              {t.family.add}
            </button>
          )}
          {hidden.length > 0 && (
            <>
              <h2>{t.family.hidden}</h2>
              <ul className="mlist">{hidden.map(row)}</ul>
            </>
          )}
          <PrizeSettings prizes={prizes} />
          <p style={{ marginTop: 24 }}>
            <button className="btn ghost" onClick={exportData}>
              ⬇️ {t.family.export}
            </button>
          </p>
        </div>
        <div>
          {editing === 'new' && <MemberForm key="new" existing={members} initial={newMemberDraft(members)} onDone={() => setEditing(null)} />}
          {target && <MemberForm key={target.id} existing={members} initial={target} id={target.id} onDone={() => setEditing(null)} />}
        </div>
      </div>
    </>
  );
}

interface FormProps {
  existing: Member[];
  initial: MemberDraft;
  id?: string;
  lockParent?: boolean;
  onDone(m?: Member): void;
}

type Text<T> = { [K in keyof T]: T[K] extends number ? string : T[K] extends number[] ? string[] : T[K] };

function MemberForm({ existing, initial, id, lockParent, onDone }: FormProps) {
  const { t } = useI18n();
  const create = useCreateMember();
  const update = useUpdateMember();
  const [f, setF] = useState<Text<MemberDraft>>(() => ({
    ...initial,
    defaultLengthsSmall: String(initial.defaultLengthsSmall),
    defaultLengthsDeep: String(initial.defaultLengthsDeep),
    monthlyPaceM: String(initial.monthlyPaceM),
    recordGoalsM: initial.recordGoalsM.map(String),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const busy = create.isPending || update.isPending;
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = memberFields.safeParse({
      name: f.name,
      subtitle: f.subtitle,
      role: lockParent ? 'parent' : f.role,
      swims: f.swims,
      color: f.color,
      avatar: f.avatar,
      defaultLengthsSmall: Number(f.defaultLengthsSmall),
      defaultLengthsDeep: Number(f.defaultLengthsDeep),
      monthlyPaceM: Number(f.monthlyPaceM),
      recordGoalsM: f.recordGoalsM.map(Number),
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        const known = t.family.field[issue.message as keyof typeof t.family.field];
        errs[key] ??= known ?? t.family.field.number;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    try {
      if (id) {
        const { member } = await update.mutateAsync({ id, patch: parsed.data });
        onDone(member);
      } else {
        const { member } = await create.mutateAsync(parsed.data);
        onDone(member);
      }
    } catch (err) {
      toast(errorText(t, err, t.common.saveFailed));
    }
  }

  const err = (k: string) =>
    errors[k] && (
      <span className="err" role="alert">
        {errors[k]}
      </span>
    );
  const usedAvatars = new Set(existing.filter((m) => m.id !== id).map((m) => m.avatar));

  return (
    <form className="form" data-color={f.color} onSubmit={submit} noValidate>
      {!lockParent && <h2>{id ? t.family.editTitle(initial.name) : t.family.newTitle}</h2>}
      <label className="field">
        <span>{t.family.name}</span>
        <input className="input" value={f.name} maxLength={LIMITS.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} autoComplete="off" />
        {err('name')}
      </label>
      <label className="field">
        <span>{t.family.subtitle}</span>
        <input className="input" value={f.subtitle} maxLength={LIMITS.subtitle} onChange={(e) => set('subtitle', e.target.value)} autoComplete="off" />
      </label>
      {!lockParent && (
        <fieldset className="field">
          <legend>{t.family.role}</legend>
          <div className="seg">
            {(['child', 'parent'] as const).map((r) => (
              <button type="button" key={r} aria-pressed={f.role === r} onClick={() => set('role', r)}>
                {r === 'parent' ? t.family.parent : t.family.child}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset className="field">
        <legend>{t.family.swimming}</legend>
        <div className="seg">
          {[true, false].map((v) => (
            <button type="button" key={String(v)} aria-pressed={f.swims === v} onClick={() => set('swims', v)}>
              {v ? t.family.swims : t.family.notSwims}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="field">
        <legend>{t.family.color}</legend>
        <div className="swatches">
          {COLORS.map((c) => (
            <button type="button" key={c} className="swatch" data-color={c} aria-label={c} aria-pressed={f.color === c} onClick={() => set('color', c)} />
          ))}
        </div>
      </fieldset>
      <fieldset className="field">
        <legend>{t.family.avatar}</legend>
        <div className="avpick">
          {AVATARS.map((a) => (
            <button type="button" key={a} aria-pressed={f.avatar === a} onClick={() => set('avatar', a)} style={usedAvatars.has(a) && f.avatar !== a ? { opacity: 0.5 } : undefined}>
              {a}
            </button>
          ))}
        </div>
      </fieldset>
      {f.swims && (
        <>
          <fieldset className="field">
            <legend>{t.family.startLengths}</legend>
            <div className="pair">
              {(['defaultLengthsSmall', 'defaultLengthsDeep'] as const).map((k) => (
                <label key={k}>
                  <span className="hint">{k === 'defaultLengthsSmall' ? t.family.startSmall : t.family.startDeep}</span>
                  <input
                    className="input"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={LIMITS.lengths}
                    value={f[k]}
                    onChange={(e) => set(k, e.target.value)}
                    aria-invalid={!!errors[k]}
                    aria-label={`${t.family.startLengths}: ${k === 'defaultLengthsSmall' ? t.family.startSmall : t.family.startDeep}`}
                  />
                </label>
              ))}
            </div>
            <span className="hint">{t.family.startHint}</span>
            {err('defaultLengthsSmall') || err('defaultLengthsDeep')}
          </fieldset>
          <label className="field">
            <span>{t.family.pace}</span>
            <input className="input" type="number" inputMode="numeric" step={100} min={LIMITS.pace[0]} max={LIMITS.pace[1]} value={f.monthlyPaceM} onChange={(e) => set('monthlyPaceM', e.target.value)} aria-invalid={!!errors.monthlyPaceM} />
            <span className="hint">{t.family.paceHint}</span>
            {err('monthlyPaceM')}
          </label>
          <fieldset className="field">
            <legend>{t.family.records}</legend>
            <div className="goals">
              {['🥉', '🥈', '🥇', '🏆'].map((medal, i) => (
                <label key={medal}>
                  <span aria-hidden="true">{medal}</span>
                  <input
                    className="input"
                    type="number"
                    inputMode="numeric"
                    step={50}
                    aria-label={`${t.family.records} ${medal}`}
                    aria-invalid={!!errors.recordGoalsM}
                    value={f.recordGoalsM[i] ?? ''}
                    onChange={(e) => set('recordGoalsM', f.recordGoalsM.map((x, j) => (j === i ? e.target.value : x)))}
                  />
                </label>
              ))}
            </div>
            <span className="hint">{t.family.recordsHint}</span>
            {err('recordGoalsM')}
          </fieldset>
        </>
      )}
      <div className="actions">
        {!lockParent && (
          <button type="button" className="btn ghost" onClick={() => onDone()}>
            {t.common.cancel}
          </button>
        )}
        <button type="submit" className="btn" disabled={busy}>
          {busy ? t.common.saving : t.common.save}
        </button>
      </div>
    </form>
  );
}
