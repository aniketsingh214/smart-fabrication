'use client';
import { notify } from '@/lib/notify';
import { useState } from 'react';
import { uploadMedia } from './upload';
import { Button } from '@/components/ui/button';
export function MediaUploader({contexts=['product','gallery','customer_design','delivery_proof','invoice']}:{contexts?:string[]}) {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  return <section className="card mb-6 p-5">
    <h2 className="mb-4 font-bold">Upload catalog media or evidence</h2>
    <form className="flex flex-wrap items-end gap-4" onSubmit={async event=>{event.preventDefault();const form=event.currentTarget;const f=new FormData(form);
      setBusy(true);setMessage('');
      try {
        const file=f.get('file');
        if(!(file instanceof File)||!file.size)throw new Error('Choose a file');
        const asset=await uploadMedia(file,String(f.get('context')));
        notify('Image uploaded and verified successfully.');setMessage(`Verified asset ready: ${asset.id}`);
        window.dispatchEvent(new Event('smartfabrication:media-updated'));form.reset();
      } catch(e) {setMessage(e instanceof Error?e.message:'Upload failed');}
      finally {setBusy(false);}
    }}>
      <label>Purpose<select aria-label="Purpose" name="context" className="mt-2">{contexts.map(c=><option value={c} key={c}>{c.replaceAll('_',' ')}</option>)}</select></label>
      <label>Image or invoice PDF up to 10 MB; product video up to 100 MB / 120 seconds<input type="file" name="file" accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm,video/quicktime" required className="mt-2"/></label>
      <Button disabled={busy}>{busy?'Uploading…':'Upload and verify'}</Button>
    </form>
    {message&&<p role="status" className="mt-4 text-xs text-orange-700">{message}</p>}
  </section>;
}




