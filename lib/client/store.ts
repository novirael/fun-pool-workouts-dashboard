'use client';

import { useSyncExternalStore } from 'react';

// Tiny observable values; the persisted ones mirror localStorage (wrapped in try/catch because
// storage can be unavailable, e.g. in private mode).

export interface Store<T> {
  get(): T;
  set(v: T): void;
  subscribe(fn: () => void): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const subs = new Set<() => void>();
  return {
    get: () => value,
    set(v) {
      if (Object.is(v, value)) return;
      value = v;
      subs.forEach((fn) => fn());
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

function persisted(key: string): Store<string | null> {
  let initial: string | null = null;
  try {
    initial = typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  } catch {}
  const s = createStore<string | null>(initial);
  const set = s.set;
  s.set = (v) => {
    try {
      if (v === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, v);
    } catch {}
    set(v);
  };
  return s;
}

/** Device token from /api/auth (never the password itself). */
export const tokenStore = persisted('pool.token');
/** The family member using this device. */
export const memberStore = persisted('pool.member');
/** Set when the server runs a newer build than this page. */
export const updateStore = createStore(false);

export const useStore = <T,>(s: Store<T>) => useSyncExternalStore(s.subscribe, s.get, s.get);
