'use client';

import dynamic from 'next/dynamic';
import { I18nProvider } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n/locale';
import Splash from './Splash';

// The app reads localStorage and today's date, so it renders only in the browser.
const App = dynamic(() => import('./App'), { ssr: false, loading: () => <Splash /> });

export default function ClientApp({ locale }: { locale: Locale }) {
  return (
    <I18nProvider locale={locale}>
      <App />
    </I18nProvider>
  );
}
