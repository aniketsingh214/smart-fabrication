/** Stable business identifiers; UUIDs remain internal keys and route values. */
export const recordPrefixes:Record<string,string>={
  "estimate-history": "EST",
  "financial-adjustments": "ADJ",
  "finance-period-closures": "FPC",
  "expense-reversals": "EXR",
  "purchase-returns": "PURR",
  "product-options": "OPT",
  "categories": "CAT",
  "product-media": "PIMG",
  "gallery": "GAL",
  "site-sections": "CMS",
  "reviews": "REV",
  "leads": "LD",
  "customers": "CUS",
  "lead-notes": "NOTE",
  "follow-ups": "FU",
  "measurements": "MSR",
  "quotations": "QT",
  "orders": "ORD",
  "material-rates": "RATE",
  "bom-versions": "BOM",
  "bom-items": "BOMI",
  "calculation-rules": "CALC",
  "suppliers": "SUP",
  "purchases": "PUR",
  "purchase-items": "PURI",
  "stock-movements": "STK",
  "stock-reservations": "RSV",
  "workers": "WRK",
  "labour-rates": "LRT",
  "work-entries": "WENT",
  "work-orders": "JOB",
  "quality-checks": "QC",
  "deliveries": "DEL",
  "installations": "INS",
  "customer-payments": "REC",
  "supplier-payments": "SPAY",
  "labour-payments": "LPAY",
  "expenses": "EXP",
  "owner-withdrawals": "OWD",
  "settings": "SET",
  "media-assets": "MED",
  "audit-logs": "AUD"
};
export function recordCode(row:Record<string,unknown>):string{return String(row.sku||row.code||row.record_code||'');}
export function recordLabel(row:Record<string,unknown>,fallback='Record'):string{
  const code=recordCode(row);
  const name=String(row.name||row.display_name||row.heading||'');
  if(name&&code&&name!==code)return `${name} — ${code}`;
  if(name)return name;
  if(row.public_id && typeof row.public_id==='string'){
    if(!row.public_id.includes('/')&&row.public_id.length<=40){
      return code ? `${row.public_id} — ${code}` : row.public_id;
    }
    const contextName=String(row.context||'Photo').replaceAll('_',' ');
    return code ? `${contextName} — ${code}` : `${contextName} asset`;
  }
  return code||fallback;
}
export const isRecordId=(value:unknown):value is string=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
