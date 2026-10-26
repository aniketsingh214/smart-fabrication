'use client';
import { useCallback,useEffect,useRef,useState } from 'react';
import { CircleCheck, CircleAlert, X } from 'lucide-react';
import type { ToastMessage } from '@/lib/notify';
type Toast=ToastMessage&{id:number};
export function ToastHost(){const [items,setItems]=useState<Toast[]>([]),host=useRef<HTMLDivElement>(null),sequence=useRef(0),timers=useRef(new Map<number,ReturnType<typeof setTimeout>>());
 const dismiss=useCallback((id:number)=>{clearTimeout(timers.current.get(id));timers.current.delete(id);setItems(items=>items.filter(item=>item.id!==id));},[]);
 useEffect(()=>{const pending=timers.current;const receive=(event:Event)=>{const detail=(event as CustomEvent<ToastMessage>).detail;if(!detail||typeof detail.message!=='string'||!['success','error'].includes(detail.kind))return;const id=++sequence.current;setItems(items=>[...items.slice(-2),{...detail,id}]);pending.set(id,setTimeout(()=>dismiss(id),detail.kind==='error'?8000:5000));};window.addEventListener('sf:toast',receive);try{const raw=sessionStorage.getItem('sf:toast');sessionStorage.removeItem('sf:toast');if(raw){const saved=JSON.parse(raw);if(Date.now()-saved.createdAt<30000)receive(new CustomEvent('sf:toast',{detail:saved}));}}catch{/* Notifications do not depend on browser storage. */}return()=>{window.removeEventListener('sf:toast',receive);for(const timer of pending.values())clearTimeout(timer);pending.clear();};},[dismiss]);
 useEffect(()=>{if(items.length)host.current?.showPopover?.();else host.current?.hidePopover?.();},[items]);
 return <div ref={host} popover="manual" className="app-toast-host" aria-label="Action notifications">{items.map(item=><div key={item.id} role={item.kind==='error'?'alert':'status'} className="app-toast" data-kind={item.kind}>{item.kind==='success'?<CircleCheck size={22}/>:<CircleAlert size={22}/>}<div><strong>{item.kind==='success'?'Success':'Could not complete'}</strong><p>{item.message}</p></div><button type="button" aria-label="Dismiss notification" onClick={()=>dismiss(item.id)}><X size={17}/></button></div>)}</div>;
}
