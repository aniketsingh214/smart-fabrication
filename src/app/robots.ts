import type { MetadataRoute } from 'next';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:['/','/catalog','/gallery'],disallow:['/admin','/account','/api','/login','/reset-password']},sitemap:`${process.env.NEXT_PUBLIC_APP_URL??'http://localhost:3000'}/sitemap.xml`};}
