import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Extract subdomain from hostname
  const hostParts = hostname.split('.');
  
  // Check if this is a subdomain request (e.g., admin.stockslearners.com)
  // We need at least 3 parts for a subdomain: [subdomain, domain, tld]
  // Also handle localhost with subdomain (e.g., admin.localhost:3000)
  const isLocalhost = hostname.includes('localhost');
  const hasSubdomain = isLocalhost 
    ? hostParts.length >= 2 && hostParts[0] !== 'localhost'
    : hostParts.length >= 3;

  if (hasSubdomain) {
    const subdomain = hostParts[0];

    // Handle admin subdomain
    if (subdomain === 'admin') {
      // Get the current path
      const pathname = url.pathname;
      
      // If already on /admin path, don't redirect
      if (!pathname.startsWith('/admin')) {
        // Rewrite to /admin + current path
        url.pathname = pathname === '/' ? '/admin' : `/admin${pathname}`;
        return NextResponse.rewrite(url);
      }
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)',
  ],
};
