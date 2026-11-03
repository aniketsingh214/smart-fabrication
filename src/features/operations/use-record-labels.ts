'use client';
import {useEffect,useMemo,useState} from 'react';
import {isRecordId} from '@/contracts/record-identity';
import {resourceMap} from '@/contracts/resources';
import {recordReferenceResources} from '@/contracts/sales-search';
export function useRecordLabels(resource:string,rows:Record<string,unknown>[],selected:Record<string,unknown>|null,permissions:string[]){
 const targets=useMemo(()=>{const groups:Record<string,Set<string>>={};for(const row of [...rows,...(selected?[selected]:[])])for(const [key,value] of Object.entries(row)){const target=resourceMap[resource]?.fields.find(f=>f.key===key)?.reference??recordReferenceResources[key];if(!target||!resourceMap[target]||!isRecordId(value)||!permissions.includes(resourceMap[target]!.domain+'.read'))continue;(groups[target]??=new Set()).add(value);}return Object.entries(groups).map(([target,ids])=>[target,[...ids].sort()] as const);},[resource,rows,selected,permissions]);
 const key=JSON.stringify(targets),[labels,setLabels]=useState<Record<string,string>>({});
 useEffect(()=>{const controller=new AbortController();const groups=JSON.parse(key) as [string,string[]][];void Promise.all(groups.flatMap(([target,ids])=>Array.from({length:Math.ceil(ids.length/100)},(_,index)=>{const params=new URLSearchParams({resource:target,ids:ids.slice(index*100,index*100+100).join(',')});return fetch('/api/v1/record-labels?'+params,{signal:controller.signal}).then(async response=>{if(!response.ok)return [];const result=await response.json();return (result.data??[]).map((row:{id:string;label:string})=>[row.id,row.label]);});}))).then(results=>{if(!controller.signal.aborted)setLabels(Object.fromEntries(results.flat()));}).catch(()=>{});return()=>controller.abort();},[key]);return labels;
}
