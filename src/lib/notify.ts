'use client';
export type ToastKind='success'|'error';
export type ToastMessage={message:string;kind:ToastKind};
export function notify(message:string,kind:ToastKind='success',afterReload=false){if(typeof window==='undefined')return;const detail={message,kind};if(afterReload){try{sessionStorage.setItem('sf:toast',JSON.stringify({...detail,createdAt:Date.now()}));return;}catch{/* Still report if storage is unavailable. */}}window.dispatchEvent(new CustomEvent<ToastMessage>('sf:toast',{detail}));}
