import {pipeline,env,RawImage} from '@huggingface/transformers';
import {cosine} from './discovery';
import type {DiscoveryProduct} from './discovery';
env.allowLocalModels=false;
if(env.backends.onnx.wasm)env.backends.onnx.wasm.numThreads=1;
const MODEL='Xenova/clip-vit-base-patch32';
const REVISION='6b7c523703ae26e39be4b03774966f8571c7f523';
let extractor:ReturnType<typeof pipeline<'image-feature-extraction'>>|undefined;
const memory=new Map<string,number[]>();
async function cache(key:string,value?:number[]):Promise<number[]|undefined>{try{const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('royal-gate-visual-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('images');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});return await new Promise((resolve,reject)=>{const tx=db.transaction('images',value?'readwrite':'readonly'),store=tx.objectStore('images');const request=value?store.put(value,key):store.get(key);request.onsuccess=()=>resolve(value??request.result);request.onerror=()=>reject(request.error);tx.oncomplete=()=>db.close();});}catch{return memory.get(key);}}
async function embedding(image:string|Blob){extractor??=pipeline('image-feature-extraction',MODEL,{device:'wasm',dtype:'q8',revision:REVISION});const run=await extractor;const input=image instanceof Blob?await RawImage.fromBlob(image):image;const tensor=await run(input);const values=Array.from(tensor.data,Number);if(values.length!==512||values.some(value=>!Number.isFinite(value)))throw Error('Vision model returned invalid image features');return values;}
self.onmessage=async(event:MessageEvent<{file:File;items:DiscoveryProduct[];requestId:number}>)=>{const {file,items,requestId}=event.data;const send=(body:object)=>self.postMessage({requestId,...body});try{
 send({type:'progress',message:'Loading private on-device vision model. First use downloads model files.'});
 const query=await embedding(file),scores:Record<string,number>={};let failed=0;
 for(let index=0;index<items.length;index++){const item=items[index],key=MODEL+':'+REVISION+':q8:'+item.id+':'+item.imageKey;try{let vector=await cache(key);if(!vector){vector=await embedding(item.embeddingUrl);memory.set(key,vector);await cache(key,vector);}scores[item.id]=cosine(query,vector);}catch{failed++;}if(index%4===0||index===items.length-1)send({type:'results',scores,processed:index+1,total:items.length,failed,done:index===items.length-1});}
 if(items.length&&!Object.keys(scores).length)throw Error('Catalogue images could not be analysed. Check your connection and retry.');
 if(!items.length)send({type:'results',scores,processed:0,total:0,failed:0,done:true});
 }catch(error){send({type:'error',message:error instanceof Error?error.message:'Visual search is unavailable. Try another image or text search.'});}};
