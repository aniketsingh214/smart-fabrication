'use client';
import { Children,isValidElement,useState,type ReactNode,type ReactElement,type TableHTMLAttributes } from 'react';
import { SortHeading } from './sort-heading';
import { compareValues,nextSort,type TableSort } from '@/lib/table-sort';
type Element=ReactElement<{children?:ReactNode;'data-sort-value'?:string|number;className?:string}>;
function value(node:ReactNode):unknown {
 if(node==null||typeof node==='boolean')return '';
 if(typeof node==='string'||typeof node==='number')return node;
 if(isValidElement(node)){const element=node as Element;return element.props['data-sort-value']??value(element.props.children);}
 return Children.toArray(node).map(item=>value(item)).join('');
}
/** Complete in-memory snapshots only. Server-paginated lists use SortHeading + API sorting. */
export function SnapshotTable({children,...props}:TableHTMLAttributes<HTMLTableElement>){
 const [sort,setSort]=useState<TableSort|null>(null),parts=Children.toArray(children);
 return <table {...props}>{parts.map(part=>{
 if(!isValidElement(part))return part;const element=part as Element;
 if(element.type==='thead')return <thead key="head">{Children.map(element.props.children,row=>{if(!isValidElement(row))return row;return <tr>{Children.map((row as Element).props.children,(cell,index)=>{if(!isValidElement(cell))return cell;const heading=cell as Element,label=String(value(heading.props.children));return ['S.No.','Actions','View'].includes(label)?cell:<SortHeading column={String(index)} sort={sort} onSort={key=>setSort(nextSort(sort,key))}>{heading.props.children}</SortHeading>;})}</tr>;})}</thead>;
 if(element.type==='tbody'){const rows=Children.toArray(element.props.children);if(sort)rows.sort((a,b)=>{const cell=(row:ReactNode)=>isValidElement(row)?Children.toArray((row as Element).props.children)[Number(sort.key)]:null;return compareValues(value(cell(a)),value(cell(b)),sort.direction);});return <tbody key="body">{rows}</tbody>;}
 return part;
 })}</table>;
}
