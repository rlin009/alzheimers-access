import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // This catches freetheburp.com OR any vercel branch preview URL matching this deployment!
  const isFreeTheBurpDomain = hostname.includes('freetheburp.com');
  const isVercelPreview = hostname.includes('cursor-export-attention-chart') || hostname.includes('vercel.app');

  // If they hit the root homepage on your custom domain OR your preview environment
  if ((isFreeTheBurpDomain || isVercelPreview) && url.pathname === '/') {
    url.pathname = '/free-the-burp';
    return NextResponse.rewrite(url);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
