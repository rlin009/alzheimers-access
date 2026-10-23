import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // If someone comes in from freetheburp.com hitting the root homepage
  if (hostname.includes('freetheburp.com') && url.pathname === '/') {
    // Rewrite their request internally to show the free-the-burp page
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
