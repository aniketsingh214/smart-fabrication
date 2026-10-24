import { z } from 'zod';

export const indianMobilePattern = /^(?:(?:\+91|91|0)[\s()-]*)?[6-9](?:[\s()-]*[0-9]){9}$/;
export const indianMobileMessage = 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.';

/** Accept national, +91/91 and domestic trunk-prefix input; never invent digits. */
export function normalizeIndianMobile(value: unknown): string | null {
  if (typeof value !== 'string' || !indianMobilePattern.test(value.trim())) return null;
  let digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9][0-9]{9}$/.test(digits) ? `+91${digits}` : null;
}

export function formatIndianMobile(value: unknown): string {
  const normalized = normalizeIndianMobile(value);
  return normalized ? `+91 ${normalized.slice(3, 8)} ${normalized.slice(8)}` : `${String(value ?? '')} (verify number)`;
}

// overwrite preserves a serializable string/regex OpenAPI contract.
export const indianMobileSchema = z.string().trim().regex(indianMobilePattern, indianMobileMessage)
  .overwrite(value => normalizeIndianMobile(value)!);
