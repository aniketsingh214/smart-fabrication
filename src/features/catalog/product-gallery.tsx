'use client';
import Image from 'next/image';
import { useRef,useState } from 'react';
export function ProductGallery({images}:{images:{url:string;alt:string}[]}){
 const [selected,setSelected]=useState(0);const zoom=useRef<HTMLDialogElement>(null);const image=images[selected];
 if(!image)return null;
 return <section aria-label="Product photographs" className="min-w-0">
  <button type="button" className="block w-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2" aria-label="Enlarge product photograph" onClick={()=>zoom.current?.showModal()}>
   <Image src={image.url} alt={image.alt} width={1200} height={800} className="aspect-[3/2] w-full rounded-2xl object-contain bg-slate-100"/>
  </button>
  <p className="mt-2 text-xs text-slate-500">Tap photograph to enlarge.</p>
  {images.length>1&&<div aria-label="Choose photograph" className="mt-3 flex gap-2 overflow-x-auto pb-2">{images.map((item,index)=><button key={item.url} aria-label={`Show photograph ${index+1}`} aria-pressed={index===selected} onClick={()=>setSelected(index)} className={`shrink-0 rounded-lg border-2 p-1 ${index===selected?'border-orange-600':'border-transparent'}`}><Image src={item.url} alt={item.alt} width={96} height={64} className="h-16 w-24 rounded object-cover"/></button>)}</div>}
  <dialog ref={zoom} aria-label="Enlarged product photograph" className="m-auto max-h-[95dvh] w-[95vw] max-w-5xl rounded-xl border-0 bg-canvas p-4 backdrop:bg-black/70">
   <button type="button" className="mb-3 rounded border px-4 py-2" onClick={()=>zoom.current?.close()}>Close photograph</button>
   <Image src={image.url} alt={image.alt} width={1600} height={1100} className="max-h-[75dvh] w-full object-contain"/>
  </dialog>
 </section>;
}
