import {uploadImage} from '@/features/media/upload';
import {apiFormError} from '@/lib/form-errors';
import type {DraftProductImage} from './product-draft-images';
export async function prepareProductImages(images:DraftProductImage[],assets:Map<string,string>,progress:(text:string)=>void){
 for(const [index,item] of images.entries()){if(assets.has(item.id))continue;progress(`Uploading image ${index+1} of ${images.length}...`);const asset=await uploadImage(item.file,'product');assets.set(item.id,asset.id);}
}
export async function attachProductImages(productId:string,name:string,images:DraftProductImage[],assets:Map<string,string>,linked:Set<string>,progress:(text:string)=>void){
 for(const [index,item] of images.entries()){if(linked.has(item.id))continue;const media=assets.get(item.id);if(!media)throw Error('Image verification is incomplete. Retry saving.');progress(`Saving image ${index+1} of ${images.length}...`);
  // A response may have been lost after the previous successful insert.
  const lookup=await fetch('/api/v1/admin/product-media?'+new URLSearchParams({context:'products',context_id:productId,limit:'100'}));const existing=await lookup.json();if(!lookup.ok)throw apiFormError(existing.error,'Could not check saved product images');if(existing.data.some((row:{media_id:string})=>row.media_id===media)){linked.add(item.id);continue;}
  const response=await fetch('/api/v1/admin/product-media',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:productId,media_id:media,alt_text:`${name} photo ${index+1}`,sort_order:index})});const result=await response.json();if(!response.ok)throw apiFormError(result.error,'Could not link image to the saved product');linked.add(item.id);
 }
}
