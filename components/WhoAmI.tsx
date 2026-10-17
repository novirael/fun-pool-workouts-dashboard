'use client';

import { useEffect } from 'react';
import type { Member } from '@/lib/domain/types';
import { useI18n } from '@/lib/i18n/context';

interface Props {
  members: Member[];
  onPick(id: string): void;
  /** Present when switching person; absent on the first-time full-screen picker. */
  onClose?: () => void;
}

export default function WhoAmI({ members, onPick, onClose }: Props) {
  const { t } = useI18n();
  const kids = members.filter((m) => m.role === 'child');
  const parents = members.filter((m) => m.role === 'parent');

  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const group = (title: string, list: Member[]) =>
    list.length > 0 && (
      <>
        <h4>{title}</h4>
        <div className="who-grid">
          {list.map((m) => (
            <button key={m.id} className="pick" data-color={m.color} onClick={() => onPick(m.id)}>
              <span className="av">{m.avatar}</span>
              {m.name}
              {m.subtitle && <small>{m.subtitle}</small>}
            </button>
          ))}
        </div>
      </>
    );

  const body = (
    <div className="card picker-card" role="dialog" aria-modal="true" aria-labelledby="who-title">
      <h3 id="who-title">{t.who.title}</h3>
      <p className="sub" style={{ margin: 0 }}>
        {t.who.hint}
      </p>
      {group(t.who.kids, kids)}
      {group(t.who.parents, parents)}
      {onClose && (
        <button className="btn ghost wide" onClick={onClose}>
          {t.common.cancel}
        </button>
      )}
    </div>
  );

  if (!onClose) return <main className="screen">{body}</main>;
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {body}
    </div>
  );
}
