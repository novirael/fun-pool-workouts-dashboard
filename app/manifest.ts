import type { MetadataRoute } from 'next';
import { messagesFor, requestLocale } from '@/lib/i18n/server';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = messagesFor(await requestLocale());
  return {
    name: t.appName,
    short_name: t.appShortName,
    description: t.appDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#eaf4f8',
    theme_color: '#1679ab',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
