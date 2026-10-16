'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="mx-auto max-w-lg p-12"><h1 className="text-2xl font-bold">Something went wrong</h1><p className="my-4 text-slate-600">We could not load this page. Please try again.</p><Button onClick={reset}>Try again</Button></main>;}
