import Link from 'next/link';
import { PublicHeader } from '@/components/layout/public-header';
import { ShopProvider } from '@/features/shop/shop-context';
import { ShopDrawers } from '@/features/shop/shop-drawers';

export const dynamic = 'force-dynamic';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShopProvider>
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-3">
        Skip to content
      </a>
      <PublicHeader />
      <main id="content">{children}</main>
      <ShopDrawers />
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-6 px-5 py-8 lg:px-8">
          <div>
            <p className="text-sm font-bold">SmartFabrication</p>
            <p className="mt-2 text-xs text-slate-400">
              Custom fabrication, from first measurement to final installation.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-xs text-slate-500">
            <Link href="/about">About & process</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/cart">Project Cart</Link>
            <Link href="/wishlist">Wishlist</Link>
            <Link href="/reviews">Reviews</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/login">Staff sign in</Link>
          </div>
        </div>
      </footer>
    </ShopProvider>
  );
}


