import ClientApp from '@/components/ClientApp';
import { requestLocale } from '@/lib/i18n/server';

// The language follows the device (Accept-Language); ?lang=pl or ?lang=en overrides it.
export default async function Home({ searchParams }: PageProps<'/'>) {
  const { lang } = await searchParams;
  const locale = await requestLocale(typeof lang === 'string' ? lang : null);
  return <ClientApp locale={locale} />;
}
