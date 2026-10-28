import Image from 'next/image';
import { cn } from '@/lib/utils';
export function BrandLogo({variant='header',background=false}:{variant?:'header'|'sidebar'|'footer'|'auth';background?:boolean}){return <span className={cn('royal-brand royal-emblem-only','royal-brand-'+variant)}><Image src={background?'/rg-logo.webp':'/rg-logo-no-bg.webp'} alt="Royal Gates crowned gate emblem" width={background?1972:1971} height={798} sizes={variant==='auth'?'320px':variant==='footer'?'160px':'120px'} className="royal-brand-art" loading={variant==='footer'?'lazy':'eager'}/></span>;}
