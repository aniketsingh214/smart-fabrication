const labels: Record<string,string> = { confirm_with_workshop: 'Confirm with the workshop', available: 'Available — scope and charges confirmed in quotation', unavailable: 'Not offered for this design' };
export function ProductServices({ delivery, installation }: { delivery: string; installation: string }) {
  return <dl aria-label="Delivery and installation" className="mb-6 grid gap-4 rounded-xl border border-slate-200 p-5 sm:grid-cols-2">{[['Delivery',delivery],['Installation',installation]].map(([name,value]) => <div key={name}><dt className="text-xs text-slate-500">{name}</dt><dd className="mt-2 text-sm">{labels[value] ?? labels.confirm_with_workshop}</dd></div>)}</dl>;
}
