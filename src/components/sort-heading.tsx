'use client';
import { ArrowDown,ArrowUp,ArrowUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import type { TableSort } from '@/lib/table-sort';
export function SortHeading({column,sort,onSort,children,disabled=false}:{column:string;sort:TableSort|null;onSort:(key:string)=>void;children:ReactNode;disabled?:boolean}){
 const active=sort?.key===column,Icon=active?(sort.direction==='asc'?ArrowUp:ArrowDown):ArrowUpDown;
 return <th scope="col" aria-sort={active?(sort.direction==='asc'?'ascending':'descending'):'none'}><button type="button" className="table-sort-button inline-flex items-center gap-2 rounded py-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50" disabled={disabled} onClick={()=>onSort(column)} title={'Sort '+String(children)+(active&&sort.direction==='asc'?' descending':' ascending')}>{children}<Icon size={14} aria-hidden="true" className={active?'shrink-0 text-teal-700':'shrink-0 opacity-45'}/></button></th>;
}
