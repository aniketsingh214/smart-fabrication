import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export const money = (minor: number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(minor/100);
export const dateTime = (value: string) => new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'}).format(new Date(value));
