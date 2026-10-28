import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { FaIcon } from '@/components/fa-icon';
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

        <footer className="royal-public-footer"><div className="royal-footer-grid"><div className="royal-footer-about"><Link href="/" aria-label="Royal Gates home"><BrandLogo variant="footer"/></Link><p>{initialLocale==='hi'?"मजबूती भी, खूबसूरती भी। लोहे और स्टील के मजबूत गेट, खिड़की की जाली, रेलिंग और शेड्स। नाप से लेकर आपके घर पर फिटिंग तक।":'Custom gates, grills, railings, doors and sheds. From site measurement to installation, bring your space to life with considered metalwork.'}</p><Link href="/contact" className="royal-footer-cta">Discuss your project <FaIcon name="arrow-right"/></Link></div><div><h2>Explore designs</h2><Link href="/catalog">Design collection</Link><Link href="/gallery">Design gallery</Link><Link href="/estimate">Price estimate</Link><Link href="/about">Our process</Link></div><div><h2>Your project</h2><Link href="/account">My account</Link><Link href="/wishlist">Saved designs</Link><Link href="/cart">Project cart</Link><Link href="/contact?measurement=1">Site measurement</Link></div><div><h2>Here to help</h2><Link href="/contact">Contact the workshop</Link><Link href="/reviews">Customer reviews</Link><Link href="/privacy">Privacy &amp; data</Link><Link href="/login">Staff sign in <FaIcon name="arrow-up-right-from-square"/></Link></div></div><div className="royal-footer-bottom"><span>Royal Gates <span aria-hidden="true">&middot;</span> Strength meets beauty</span><span>Designed for your space. Built with care.</span></div></footer>
        </VisitorContact>
      </ShopProvider>
    </LocaleProvider>
  );
}
