import type { Lang } from '@/lib/domain/types';

export interface Locale {
  lang: Lang;
  /** BCP 47 tag used for numbers and dates, e.g. 'pl-PL' or 'en-US'. */
  format: string;
}

const DEFAULT_FORMAT: Record<Lang, string> = { pl: 'pl-PL', en: 'en-GB' };
export const FALLBACK: Locale = { lang: 'en', format: DEFAULT_FORMAT.en };

const canonical = (tag: string): string | null => {
  try {
    return Intl.getCanonicalLocales(tag)[0] ?? null;
  } catch {
    return null;
  }
};

/**
 * Picks Polish or English from the device's preferred languages (Accept-Language), by q-weight.
 * Anything else falls back to English. `override` ('pl' | 'en', from ?lang=) wins.
 */
export function detectLocale(acceptLanguage: string | null | undefined, override?: string | null): Locale {
  if (override === 'pl' || override === 'en') return { lang: override, format: DEFAULT_FORMAT[override] };
  const prefs = (acceptLanguage ?? '')
    .split(',')
    .map((part, i) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { tag: tag.trim(), q: q ? Number(q.slice(2)) : 1, i };
    })
    .filter((p) => p.tag && p.tag !== '*' && Number.isFinite(p.q) && p.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  for (const p of prefs) {
    const tag = canonical(p.tag);
    const primary = tag?.split('-')[0]?.toLowerCase();
    if (tag && (primary === 'pl' || primary === 'en')) return { lang: primary, format: tag.includes('-') ? tag : DEFAULT_FORMAT[primary] };
  }
  return FALLBACK;
}
