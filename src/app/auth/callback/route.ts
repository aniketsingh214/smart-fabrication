import { NextResponse,type NextRequest } from 'next/server';
import { serverClient } from '@/lib/supabase/server';
import { safeInternalRedirect } from '@/contracts/redirect';
export async function GET(request:NextRequest){const code=request.nextUrl.searchParams.get('code'),next=request.nextUrl.searchParams.get('next');if(code){const db=await serverClient();const {error}=await db.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(safeInternalRedirect(next,request.nextUrl.origin));}return NextResponse.redirect(new URL('/login',request.nextUrl.origin));}
