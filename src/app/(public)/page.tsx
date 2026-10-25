import { serverClient } from '@/lib/supabase/server';
import { CategoryCards } from '@/features/catalog/category-cards';
import { FeaturedProducts } from '@/features/catalog/featured-products';
import { HomeView } from '@/features/home/home-view';

export default async function Home() {
  const db = await serverClient();

  // Fetch sections, product count, and site_settings from database
  const [{ data: sections }, { count: totalProductsCount }, { data: settings }] = await Promise.all([
    db
      .from('website_sections')
      .select('id,heading,body,name')
      .eq('status', 'published')
      .neq('name', 'hero')
      .order('sort_order')
      .order('id')
      .limit(8),
    db
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    db
      .from('site_settings')
      .select('name,value')
      .eq('public', true)
  ]);

  const totalDesigns = totalProductsCount ?? 315;
  const phone = settings?.find(s => s.name === 'phone')?.value || '+91 98765 43210';
  const whatsapp = settings?.find(s => s.name === 'whatsapp')?.value || phone;

  const customSections = sections
    ?.filter(s => !['hero', 'about', 'process'].includes(s.name))
    .map(s => (
      <div key={s.id} className="card mt-8 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900">{s.heading}</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{s.body}</p>
      </div>
    ));

  return (
    <HomeView
      totalDesigns={totalDesigns}
      featuredSection={<FeaturedProducts />}
      categoriesSection={<CategoryCards />}
      customSections={customSections}
      phone={phone}
      whatsapp={whatsapp}
    />
  );
}
