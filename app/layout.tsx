import type { Metadata, Viewport } from 'next';
import { Baloo_2 } from 'next/font/google';
import { messagesFor, requestLocale } from '@/lib/i18n/server';
import './globals.css';

const baloo = Baloo_2({
  variable: '--font-baloo',
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600', '700', '800'],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = messagesFor(await requestLocale());
  return {
    title: t.appName,
    description: t.appDescription,
    // A private family app: keep it out of search engines.
    robots: { index: false, follow: false },
    appleWebApp: { capable: true, title: t.appName, statusBarStyle: 'default' },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eaf4f8' },
    { media: '(prefers-color-scheme: dark)', color: '#081a2a' },
  ],
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await requestLocale();
  return (
    <html lang={locale.lang} className={baloo.variable}>
      <body>{children}</body>
    </html>
  );
}
