'use client';

import { useI18n } from '@/lib/i18n/context';

export interface Tab {
  key: string;
  icon: string;
  label: string;
}

export default function TabBar({ tabs, active, onTab }: { tabs: Tab[]; active: string; onTab(key: string): void }) {
  const { t } = useI18n();
  return (
    <nav className="tabs" aria-label={t.tabs.nav}>
      <div className="in">
        {tabs.map((tab) => (
          <button key={tab.key} className={active === tab.key ? 'act' : ''} onClick={() => onTab(tab.key)} aria-current={active === tab.key ? 'page' : undefined}>
            <span className="ico">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
