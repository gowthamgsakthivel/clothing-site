import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of API routes that can be safely cached
const CACHEABLE_ROUTES = [
  '/api/product/list',
  '/api/category/',
  '/api/gender-category/'
];

// Cache duration for different routes (in seconds)
const CACHE_DURATIONS = {
  '/api/product/list': 60 * 5, // 5 minutes
  '/api/category/': 60 * 60, // 1 hour
  '/api/gender-category/': 60 * 60, // 1 hour
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only apply caching to GET requests on specific API routes
  if (
    request.method === 'GET' &&
    CACHEABLE_ROUTES.some(route => pathname.startsWith(route))
  ) {
    // Set Cache-Control header to enable CDN caching
    const response = NextResponse.next();
    
    // Find the matching route for cache duration
    const matchingRoute = CACHEABLE_ROUTES.find(route => pathname.startsWith(route));
    const maxAge = matchingRoute ? CACHE_DURATIONS[matchingRoute] : 60; // Default 1 minute
    
    // Set cache headers
    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`
    );
    
    return response;
  }
  
  return NextResponse.next();
}

// Configure which paths this middleware will run on
export const config = {
  matcher: ['/api/:path*'],
};
