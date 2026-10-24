import { normalizeIndianMobile } from '@/contracts/phone';

export function designEnquiryUrl(phone:string|undefined,origin:string,product:{name:string;slug:string;design_code?:string|null}) {
  const mobile=normalizeIndianMobile(phone);
  if(!mobile)return null;
  const url=new URL(`/catalog/${encodeURIComponent(product.slug)}`,origin);
  const message=`Hello, I would like to enquire about ${product.name}${product.design_code?` (${product.design_code})`:''}.\nDesign: ${url}\nPlease confirm suitable dimensions, material, price and installation scope.`;
  return `https://wa.me/${mobile.slice(1)}?text=${encodeURIComponent(message)}`;
}
