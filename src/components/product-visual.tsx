import Image from 'next/image';
import { GateIllustration } from './gate-illustration';
type Asset={public_id:string;visibility?:string;resource_type:string};
type Media={alt_text:string;sort_order?:number;media_assets:Asset|Asset[]|null};
export function ProductVisual({media,alt,className=''}:{media?:Media[];alt:string;className?:string}){
  const cloud=process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const image=media?.slice().sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)).map(m=>({alt:m.alt_text,asset:Array.isArray(m.media_assets)?m.media_assets[0]:m.media_assets})).find(m=>m.asset?.resource_type==='image'&&m.asset.visibility!=='private');
  if(!cloud||!image?.asset)return <GateIllustration label="Concept illustration; product photography available on request" className={className}/>;
  return <Image src={`https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_1200/${image.asset.public_id}`} alt={image.alt||alt} width={1200} height={800} className={className}/>;
}
