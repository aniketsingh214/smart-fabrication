let locks=0;
let previous='';
/** Nested record/create dialogs must not restore each other's stale body state. */
export function lockDialogScroll(){
 if(typeof document==='undefined')return ()=>{};
 if(locks===0){previous=document.body.style.overflow;document.body.style.overflow='hidden';}
 locks++;
 let released=false;
 return ()=>{if(released)return;released=true;locks--;if(locks===0)document.body.style.overflow=previous;};
}
