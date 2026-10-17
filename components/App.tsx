'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { makeQueryClient, useFamily } from '@/lib/client/queries';
import { memberStore, tokenStore, useStore } from '@/lib/client/store';
import { useI18n } from '@/lib/i18n/context';
import FamilySettings from './FamilySettings';
import Main from './Main';
import PasswordDialog from './PasswordDialog';
import Splash from './Splash';
import Toast, { errorText } from './Toast';
import WhoAmI from './WhoAmI';

export default function App() {
  const [client] = useState(makeQueryClient);
  const { locale } = useI18n();

  // The server picks the language from Accept-Language; keep <html lang> right when ?lang= overrides it.
  useEffect(() => {
    document.documentElement.lang = locale.lang;
  }, [locale.lang]);

  return (
    <QueryClientProvider client={client}>
      <Gate />
      <Toast />
    </QueryClientProvider>
  );
}

/** Password → (first run: create a parent) → "who's here?" → the app. */
function Gate() {
  const token = useStore(tokenStore);
  return token ? <Family /> : <PasswordDialog />;
}

function Family() {
  const { t } = useI18n();
  const memberId = useStore(memberStore);
  const q = useFamily(true);

  if (q.isPending) return <Splash />;
  if (!q.data) {
    return (
      <main className="screen">
        <div className="card">
          <p className="lead" aria-hidden="true">
            🌊
          </p>
          <p>{errorText(t, q.error, t.common.loadFailed)}</p>
          <button className="btn wide" onClick={() => q.refetch()}>
            {t.common.retry}
          </button>
        </div>
      </main>
    );
  }

  const state = q.data;
  if (!state.members.length) return <FamilySettings members={[]} onCreated={(m) => memberStore.set(m.id)} />;
  const active = state.members.filter((m) => !m.archived);
  const me = active.find((m) => m.id === memberId);
  if (!me) return <WhoAmI members={active} onPick={(id) => memberStore.set(id)} />;
  // Switching person remounts the app on its start screen.
  return <Main key={me.id} state={state} me={me} />;
}
