export function catalogFilters(params:{material?:string|string[];budget?:string|string[];sort?:string|string[]}){
 const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]??'':value??'';
 const material=first(params.material).replace(/[%_\\,().]/g,'').trim().slice(0,80);
 const input=first(params.budget);const budget=/^\d{1,8}$/.test(input)&&Number(input)>0?String(Number(input)):'';
 const value=first(params.sort);const sort=['price-low','price-high','name'].includes(value)?value:'recent';
 return {material,budget,sort};
}
