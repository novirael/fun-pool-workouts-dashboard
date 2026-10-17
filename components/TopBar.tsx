'use client';

import type { Member } from '@/lib/domain/types';
import { useI18n } from '@/lib/i18n/context';

interface Props {
  me: Member;
  showFamily: boolean;
  onSwitch(): void;
  onFamily(): void;
}

export default function TopBar({ me, showFamily, onSwitch, onFamily }: Props) {
  const { t } = useI18n();
  return (
    <div className="topbar">
      <button className="chip" data-color={me.color} onClick={onSwitch} aria-label={t.who.switch(me.name)}>
        <span className="e">{me.avatar}</span>
        {me.name} <small>· {t.who.change}</small>
      </button>
      {showFamily && (
        <button className="iconbtn" onClick={onFamily} aria-label={t.who.settings} title={t.who.settings}>
          ⚙️
        </button>
      )}
    </div>
  );
}
