import Link from 'next/link';
import { VisitorContact } from '@/features/contacts/visitor-contact';
import { PublicHeader } from '@/components/layout/public-header';
import { ShopProvider } from '@/features/shop/shop-context';
import { ShopDrawers } from '@/features/shop/shop-drawers';
import { LocaleProvider } from '@/lib/i18n/locale-context';
import { getServerLocale } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const initialLocale = await getServerLocale();

  return (
    <LocaleProvider initialLocale={initialLocale}>
      <ShopProvider>
        <VisitorContact>
        <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-3">
          Skip to content
        </a>
        <PublicHeader />
        <main id="content">{children}</main>
        <ShopDrawers />

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-6 px-5 py-8 lg:px-8">
            <div>
              <p className="text-sm font-bold text-slate-900">SmartFabrication</p>
              <p className="mt-1.5 text-xs text-slate-500 max-w-sm leading-5">
                लोहे और स्टील के मजबूत गेट, खिड़की की जाली और रेलिंग। नाप से लेकर आपके घर पर फिटिंग तक।
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Custom fabrication, from first measurement to final installation.
              </p>
            </div>
            <div className="flex flex-wrap gap-5 text-xs text-slate-600">
              <Link href="/about" className="hover:text-orange-600 transition">About & process</Link>
              <Link href="/contact" className="hover:text-orange-600 transition">Contact</Link>
              <Link href="/cart" className="hover:text-orange-600 transition">Project Cart</Link>
              <Link href="/wishlist" className="hover:text-orange-600 transition">Wishlist</Link>
              <Link href="/reviews" className="hover:text-orange-600 transition">Reviews</Link>
              <Link href="/privacy" className="hover:text-orange-600 transition">Privacy</Link>
              <Link href="/login" className="hover:text-orange-600 transition">Staff sign in</Link>
            </div>
          </div>
        </footer>
        </VisitorContact>
      </ShopProvider>
    </LocaleProvider>
  );
}
