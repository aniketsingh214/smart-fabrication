import { indianMobileMessage, normalizeIndianMobile } from '@/contracts/phone';

export function MobileInput({id,name,required,defaultValue,ariaLabel,invalid,describedBy}:{id?:string;name:string;required?:boolean;defaultValue?:string;ariaLabel?:string;invalid?:boolean;describedBy?:string}) {
  const normalized = normalizeIndianMobile(defaultValue);
  return <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-orange-600 focus-within:ring-offset-2">
    <span aria-hidden="true" className="border-r border-slate-200 px-3 text-sm text-slate-600">+91</span>
    <input id={id} name={name} aria-label={ariaLabel} aria-invalid={invalid||undefined} aria-describedby={describedBy} type="tel" inputMode="tel" autoComplete="tel-national" required={required}
      pattern={String.raw`(?:(?:\+91|91|0)[\s\(\)\-]*)?[6-9](?:[\s\(\)\-]*[0-9]){9}`} title={indianMobileMessage} maxLength={24} placeholder="98765 43210"
      defaultValue={normalized ? normalized.slice(3) : defaultValue}
      className="!rounded-none !border-0 !outline-none"
      onBlur={event=>{const phone=normalizeIndianMobile(event.currentTarget.value);if(phone)event.currentTarget.value=phone.slice(3);}}/>
  </div>;
}
