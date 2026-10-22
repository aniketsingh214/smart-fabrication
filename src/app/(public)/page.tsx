import { serverClient } from '@/lib/supabase/server';
import { CategoryCards } from '@/features/catalog/category-cards';
import { FeaturedProducts } from '@/features/catalog/featured-products';
import { HomeView } from '@/features/home/home-view';

export default async function Home() {
  const db = await serverClient();

  // Fetch sections and hero from database
  const [{ data: sections }, { count: totalProductsCount }] = await Promise.all([
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
      .eq('status', 'published')
  ]);

  const totalDesigns = totalProductsCount ?? 315;

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
    />
  );
}
