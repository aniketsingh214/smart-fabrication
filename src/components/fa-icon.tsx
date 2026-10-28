import { cn } from '@/lib/utils';
/** Decorative local Font Awesome glyph; name must be a constant from the free solid set. */
export function FaIcon({name,className}:{name:string;className?:string}){return <i aria-hidden="true" className={cn('fa-solid','fa-'+name,'royal-icon',className)}/>;}
