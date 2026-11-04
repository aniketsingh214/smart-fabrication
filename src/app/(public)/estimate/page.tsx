import {z} from 'zod';
import { Calculator } from '@/features/estimates/calculator';
import { serverClient } from '@/lib/supabase/server';
export const metadata = {
  title: 'कीमत का अनुमान लगाएं | Approximate project estimate | SmartFabrication',
  description: 'लोहे और स्टील के गेट, रेलिंग और जाली का अनुमानित खर्च तुरंत जानें।'
};
export default async function EstimatePage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  const db = await serverClient();
  const { data, error } = await db
    .from('products')
    .select('id,name')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(100);

  const choices=[...(data??[])];
  if(product&&z.uuid().safeParse(product).success&&!choices.some(item=>item.id===product)){const {data:requested}=await db.from('products').select('id,name').eq('status','published').eq('id',product).maybeSingle();if(requested)choices.unshift(requested);}
  return (
    <main className="mx-auto max-w-6xl px-5 py-14">
      <p className="eyebrow text-orange-600">खर्च का सही अंदाज़ा · An informed starting point</p>
      <h1 className="mt-3 text-3xl sm:text-4xl font-bold" aria-label="Estimate your project">
        कीमत का अनुमान लगाएँ <span className="block sm:inline text-xl sm:text-2xl font-normal text-slate-400">(Estimate your project)</span>
      </h1>
      <p className="mb-8 mt-3 text-sm text-slate-500">
        लोहा और स्टील का काम शुरू करने से पहले खर्च का सही अंदाज़ा लगाएं। अंतिम नाप और पक्का कोटेशन वर्कशॉप द्वारा तय होगा।
      </p>
      {error ? (
        <p role="alert" className="text-red-600">Products could not be loaded.</p>
      ) : (
        <Calculator products={choices} selected={choices.some(item=>item.id===product)?product:undefined} />
      )}
    </main>
  );
}
