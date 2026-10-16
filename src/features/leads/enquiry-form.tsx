'use client';
import { useState } from 'react';
import type { ProductVariant,ProductOption } from '@/contracts/catalog';
import { Button } from '@/components/ui/button';
import { uploadImage } from '@/features/media/upload';
export function EnquiryForm({product,initialRequirement,variants=[],options=[]}:{product?:string;initialRequirement?:string;variants?:ProductVariant[];options?:ProductOption[]}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(false);
  async function submit(form:FormData) {
    setBusy(true);setError('');
    try {
      const file=form.get('design');
      if(file instanceof File&&file.size&&(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024))throw new Error('Choose a JPG, PNG or WebP design up to 10 MB.');
      const payload={name:String(form.get('name')).trim(),phone:String(form.get('phone')).replace(/[\s()-]/g,''),email:form.get('email')||null,city:form.get('city'),requirement:form.get('requirement'),product_id:product??null,source:'direct',website:form.get('website'),selected_variant_id:form.get('selected_variant_id')||null,selected_option_ids:form.getAll('selected_option_ids')};
      const response=await fetch('/api/v1/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error?.message??'Unable to send enquiry');
      setDone(true);
      if(file instanceof File&&file.size) {
        try {if(!result.data.uploadToken)throw new Error('Image uploads are not configured yet');await uploadImage(file,'customer_design',result.data.uploadToken);}
        catch(e){setError(`Your enquiry is saved. Reference image could not be attached: ${e instanceof Error?e.message:'please contact the workshop'}`);}
      }
    } catch(e) {setError(e instanceof Error?e.message:'Unable to connect. Please try again.');}
    finally {setBusy(false);}
  }
  if(done)return <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8" role="status">
    <h2 className="text-xl font-bold text-emerald-800">Your enquiry has been received.</h2>
    <p className="mt-3 text-sm leading-6 text-emerald-700">Our team will review your requirement and follow up about measurement and a quotation.</p>
    {busy&&<p className="mt-3 text-xs text-emerald-700">Attaching your reference image…</p>}
    {error&&<p role="alert" className="mt-4 text-sm text-orange-800">{error}</p>}
    <Button variant="outline" disabled={busy} className="mt-6" onClick={()=>{setDone(false);setError('');}}>Send another enquiry</Button>
  </div>;
  return <form onSubmit={event=>{event.preventDefault();void submit(new FormData(event.currentTarget));}} className="space-y-5">
    <div className="grid gap-5 sm:grid-cols-2">
      <label>Your name<input className="mt-2" name="name" required minLength={2} maxLength={120} autoComplete="name"/></label>
      <label>Mobile / WhatsApp<input className="mt-2" name="phone" type="tel" required pattern="[+0-9 ()-]{10,20}" autoComplete="tel"/></label>
      <label>Email (optional)<input className="mt-2" name="email" type="email" autoComplete="email"/></label>
      <label>City / area<input className="mt-2" name="city" required minLength={2} maxLength={100} autoComplete="address-level2"/></label>
    </div>
    {variants.length>0&&<label className="block">Preferred variant (optional)<select className="mt-2" name="selected_variant_id" aria-label="Preferred variant"><option value="">Discuss with the workshop</option>{variants.map(v=><option key={v.id} value={v.id}>{v.name}{v.colour?` · ${v.colour}`:''}{v.finish?` · ${v.finish}`:''}</option>)}</select></label>}
    {options.length>0&&<fieldset className="space-y-3 rounded-lg border border-slate-200 p-4"><legend className="px-1 text-sm font-semibold">Preferred options (optional)</legend>{options.map(o=><label key={o.id} className="flex items-center gap-3 text-sm"><input type="checkbox" name="selected_option_ids" value={o.id} className="h-4 w-4 accent-orange-600"/>{o.option_group}: {o.name}</label>)}<p className="text-xs text-slate-500">Select up to 20. Choices are indicative; final scope and price require a quotation.</p></fieldset>}
    <label className="block">Tell us about your requirement<textarea className="mt-2" name="requirement" defaultValue={initialRequirement} rows={5} required minLength={10} maxLength={2000} placeholder="What would you like fabricated? Include approximate dimensions, material and installation requirements."/></label>
    <label className="block">Reference design (optional)<input name="design" type="file" accept="image/jpeg,image/png,image/webp" className="mt-2"/><span className="mt-2 block text-xs font-normal text-slate-400">JPG, PNG or WebP, up to 10 MB. Shared privately with authorized workshop staff.</span></label>
    <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <p className="text-xs leading-5 text-slate-400">We use these details to respond to your enquiry. No customer account is required. Please avoid including sensitive information.</p>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <Button disabled={busy} size="lg">{busy?'Sending…':'Send enquiry'}</Button>
  </form>;
}



