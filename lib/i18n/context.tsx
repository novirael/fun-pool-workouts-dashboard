'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Localized } from '@/lib/domain/types';
import { en } from './en';
import { makeFormat, type Format } from './format';
import { FALLBACK, type Locale } from './locale';
import { pl, type Messages } from './pl';

export interface I18n extends Format {
  locale: Locale;
  t: Messages;
  /** Picks the current language from localized content data. */
  L(x: Localized): string;
  /** "12 długości" / "12 lengths". */
  dl(n: number): string;
}

export function makeI18n(locale: Locale): I18n {
  const t = locale.lang === 'pl' ? pl : en;
  return { ...makeFormat(locale.format), locale, t, L: (x) => x[locale.lang], dl: (n) => `${n} ${t.units.lengths(n)}` };
}

const Ctx = createContext<I18n>(makeI18n(FALLBACK));

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => makeI18n(locale), [locale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
