export type Quota={name:string;limit:number;seconds:number};
export function isMutation(method:string){return ['POST','PUT','PATCH','DELETE'].includes(method.toUpperCase());}
export function requestQuotas(path:string):Quota[]{const base:Quota={name:'api-write',limit:180,seconds:60};
 if(/^\/api\/v1\/(visitor-contact|leads)\/?$/.test(path))return [base,{name:'public-enquiry',limit:6,seconds:600}];
 if(path.startsWith('/api/v1/auth/'))return [base,{name:'auth',limit:10,seconds:600}];
 if(path==='/api/v1/estimates')return [base,{name:'estimate-save',limit:30,seconds:60}];
 if(path==='/api/v1/estimates/preview')return [base,{name:'estimate-preview',limit:60,seconds:60}];
 if(path.startsWith('/api/v1/uploads/guest/'))return [base,{name:'guest-upload',limit:20,seconds:600}];
 return [base];
}
export function actorQuotas(path:string):Quota[]{const quotas:Quota[]=[{name:'actor-write',limit:120,seconds:60}];if(/\/(finance|purchases\/returns|inventory\/adjustments|admin\/permissions)(\/|$)/.test(path)||/\/(roles|status|approve|receive|accept|reject|convert|transitions|release)$/.test(path)||/\/admin\/(customer-payments|supplier-payments|labour-payments|work-entries|owner-withdrawals|expense-reversals)(\/|$)/.test(path))quotas.push({name:'sensitive-write',limit:20,seconds:60});return quotas;}
