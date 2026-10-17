import 'server-only';
import { headers } from 'next/headers';
import { en } from './en';
import { detectLocale, type Locale } from './locale';
import { pl } from './pl';

export async function requestLocale(override?: string | null): Promise<Locale> {
  return detectLocale((await headers()).get('accept-language'), override);
}

export const messagesFor = (locale: Locale) => (locale.lang === 'pl' ? pl : en);
