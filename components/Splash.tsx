'use client';

import { useI18n } from '@/lib/i18n/context';

export default function Splash() {
  const { t } = useI18n();
  return (
    <div className="screen" aria-busy="true">
      <p className="muted" style={{ fontSize: 40, textAlign: 'center' }}>
        🏊
        <br />
        <span style={{ fontSize: 17 }}>{t.common.loading}</span>
      </p>
    </div>
  );
}
