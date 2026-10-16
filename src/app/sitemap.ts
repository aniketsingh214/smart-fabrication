import type { MetadataRoute } from 'next';
export default function sitemap():MetadataRoute.Sitemap{const base=process.env.NEXT_PUBLIC_APP_URL??'http://localhost:3000';return ['/','/about','/catalog','/gallery','/reviews','/estimate','/contact','/privacy'].map(p=>({url:`${base}${p}`,changeFrequency:'weekly',priority:p==='/'?1:0.7}));}

