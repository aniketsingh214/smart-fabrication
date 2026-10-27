export type FieldErrors=Record<string,string>;
type Controller={show:(errors:FieldErrors)=>void};
const forms=new WeakMap<HTMLFormElement,Controller>(),sources=new WeakMap<FormData,HTMLFormElement>();
export function registerForm(form:HTMLFormElement,controller:Controller){forms.set(form,controller);return ()=>{forms.delete(form);};}
export function validatedFormData(form:HTMLFormElement){const data=new FormData(form);sources.set(data,form);return data;}
export class FieldValidationError extends Error{constructor(public readonly fields:FieldErrors,message='Please correct the highlighted fields.'){super(message);}}
export function errorFields(error:unknown):FieldErrors{
 if(error instanceof FieldValidationError)return error.fields;
 if(!error||typeof error!=='object')return {};
 const value=error as {issues?:{path?:PropertyKey[];message?:string}[];details?:{field?:string;message?:string}[]};
 const issues=Array.isArray(value.issues)?value.issues:Array.isArray(value.details)?value.details:[];
 const result:FieldErrors={};for(const issue of issues){const entry=issue as {path?:PropertyKey[];field?:string;message?:string};const key=entry.field??entry.path?.map(String).join('.');if(key&&entry.message)result[key]??=entry.message;}return result;
}
export function apiFormError(error:unknown,fallback:string){const value=error&&typeof error==='object'?error as {message?:string}:{};return new FieldValidationError(errorFields(error),value.message??fallback);}
const aliases:Record<string,string>={amount_minor:'amount',unit_cost_minor:'unit_cost',address:'site_address',staff_user:'staff',bytes:'file',format:'file',resource_type:'file'};
export function mapFieldErrors(errors:FieldErrors,names:readonly string[]):FieldErrors{
 const result:FieldErrors={};for(const [path,message] of Object.entries(errors)){const short=path.split('.').at(-1)!;const key=[path,short,aliases[path],aliases[short]].find(key=>key&&names.includes(key));if(key)result[key]??=message;}return result;
}
export function reportFormError(target:FormData|HTMLFormElement,error:unknown):boolean{
 const form=typeof HTMLFormElement!=='undefined'&&target instanceof HTMLFormElement?target:sources.get(target as FormData);if(!form)return false;
 const controller=forms.get(form);if(!controller)return false;
 const names=Array.from(form.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input,select,textarea')).filter(input=>input.type!=='hidden'&&!input.closest('[hidden]')).map(input=>input.name||input.id);
 const fields=mapFieldErrors(errorFields(error),names);if(!Object.keys(fields).length)return false;controller.show(fields);return true;
}
