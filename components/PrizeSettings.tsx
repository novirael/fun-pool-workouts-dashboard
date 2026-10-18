'use client';

import { useState, type FormEvent } from 'react';
import { useCreatePrize, useDeletePrize, useUpdatePrize } from '@/lib/client/queries';
import { LIMITS } from '@/lib/domain/members';
import { chanceOf } from '@/lib/domain/prizes';
import type { Prize } from '@/lib/domain/types';
import { useI18n } from '@/lib/i18n/context';
import { prizeFields } from '@/lib/validation';
import { errorText, toast } from './Toast';

/** Parents list the wheel-of-fortune prizes; each one's chance is its weight relative to the others. */
export default function PrizeSettings({ prizes }: { prizes: Prize[] }) {
  const { t } = useI18n();
  const create = useCreatePrize();
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('10');

  function add(e: FormEvent) {
    e.preventDefault();
    const parsed = prizeFields.safeParse({ name, weight: Number(weight) });
    if (!parsed.success) return toast(t.family.field[parsed.error.issues[0]?.message === 'name_required' ? 'name_required' : 'number']);
    create.mutate(parsed.data, {
      onSuccess: () => setName(''),
      onError: (err) => toast(errorText(t, err, t.common.saveFailed)),
    });
  }

  return (
    <section>
      <h2>{t.family.prizesTitle}</h2>
      <p className="small muted" style={{ margin: '-4px 0 10px' }}>
        {prizes.length ? t.family.prizesHint : t.family.prizesEmpty}
      </p>
      <ul className="prizes">
        {prizes.map((p) => (
          <PrizeRow key={`${p.id}:${p.name}:${p.weight}`} prize={p} prizes={prizes} />
        ))}
      </ul>
      {prizes.length < LIMITS.prizes && (
        <form className="prize" onSubmit={add} style={{ marginTop: 8 }}>
          <input className="input" value={name} maxLength={LIMITS.prizeName} placeholder={t.family.prizePlaceholder} aria-label={t.family.prizeName} onChange={(e) => setName(e.target.value)} />
          <input className="input" type="number" inputMode="numeric" min={LIMITS.weight[0]} max={LIMITS.weight[1]} value={weight} aria-label={t.family.chance} onChange={(e) => setWeight(e.target.value)} />
          <span />
          <button className="btn sm" type="submit" disabled={create.isPending || !name.trim()}>
            {t.family.addPrize}
          </button>
        </form>
      )}
    </section>
  );
}

function PrizeRow({ prize, prizes }: { prize: Prize; prizes: Prize[] }) {
  const { t, fmtNum } = useI18n();
  const update = useUpdatePrize();
  const remove = useDeletePrize();
  const [name, setName] = useState(prize.name);
  const [weight, setWeight] = useState(String(prize.weight));
  const dirty = name !== prize.name || weight !== String(prize.weight);
  const fail = (e: unknown) => toast(errorText(t, e, t.common.saveFailed));

  function save() {
    const parsed = prizeFields.safeParse({ name, weight: Number(weight) });
    if (!parsed.success) return toast(t.family.field.number);
    update.mutate({ id: prize.id, patch: parsed.data }, { onError: fail });
  }

  return (
    <li className="prize">
      <input className="input" value={name} maxLength={LIMITS.prizeName} aria-label={t.family.prizeName} onChange={(e) => setName(e.target.value)} />
      <input className="input" type="number" inputMode="numeric" min={LIMITS.weight[0]} max={LIMITS.weight[1]} value={weight} aria-label={`${t.family.chance}: ${prize.name}`} onChange={(e) => setWeight(e.target.value)} />
      <span className="pct">{t.family.percent(fmtNum(chanceOf(prize, prizes) * 100, 0))}</span>
      {dirty ? (
        <button className="btn sm" onClick={save} disabled={update.isPending}>
          {t.common.save}
        </button>
      ) : (
        <button className="btn ghost sm" onClick={() => remove.mutate(prize.id, { onError: fail })} disabled={remove.isPending} aria-label={`${t.common.delete}: ${prize.name}`}>
          ✕
        </button>
      )}
    </li>
  );
}
