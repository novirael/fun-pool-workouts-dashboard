'use client';

import { createStore, useStore } from '@/lib/client/store';
import { ApiError } from '@/lib/client/api';
import type { Messages } from '@/lib/i18n/pl';

const toastStore = createStore<string | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

export function toast(msg: string) {
  toastStore.set(msg);
  clearTimeout(timer);
  timer = setTimeout(() => toastStore.set(null), 2600);
}

/** Localized message for a failed request. */
export function errorText(t: Messages, e: unknown, fallback: string): string {
  if (!(e instanceof ApiError)) return fallback;
  if (e.code === 'offline') return t.common.offline;
  if (e.code === 'server_error' || e.code === 'bad_request') return fallback;
  return t.errors[e.code];
}

export default function Toast() {
  const msg = useStore(toastStore);
  return (
    <div className="toast" role="status" hidden={!msg}>
      {msg}
    </div>
  );
}
