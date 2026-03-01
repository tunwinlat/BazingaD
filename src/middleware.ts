import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitMiddleware } from './lib/rate-limiter';

// Security headers to add to all responses
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Build CSP header
 * Uses strict policy in production, relaxed in development for Next.js compatibility
 */
function buildCSPHeader(isDev: boolean): string {
  if (isDev) {
    // Relaxed CSP for development - allows Next.js dev features
    return `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://api.open-meteo.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s+/g, ' ').trim();
  }
  
  // Production CSP - stricter but still allows necessary inline scripts
  // Note: For full CSP without unsafe-inline, you need to configure Next.js
  // to use nonces via experimental features or use a build-time hash approach
  return `
    default-src 'self';
    script-src 'self' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self' https://api.open-meteo.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim();
}

/**
 * Strip Next.js internal headers that reveal implementation details
 */
function stripNextJsHeaders(response: NextResponse): void {
  // Remove headers that reveal Next.js internal mechanisms
  const headersToRemove = [
    'x-nextjs-cache',
    'x-nextjs-prerender',
    'x-nextjs-prerender-bypass',
    'x-nextjs-stale-time',
    'x-nextjs-revalidated-tags',
    'x-nextjs-revalidate-tag-token',
  ];
  
  headersToRemove.forEach(header => {
    response.headers.delete(header);
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDev = process.env.NODE_ENV !== 'production';
  
  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    let rateLimitType: 'api' | 'login' | 'sensitive' | 'health' = 'api';
    
    if (pathname.includes('/auth/login')) {
      rateLimitType = 'login';
    } else if (
      pathname.includes('/auth/password') ||
      pathname.includes('/auth/totp') ||
      pathname.includes('/settings')
    ) {
      rateLimitType = 'sensitive';
    } else if (pathname.includes('/health')) {
      rateLimitType = 'health';
    }
    
    const rateLimitResponse = await rateLimitMiddleware(request, rateLimitType);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // For API routes, let the request through and add security headers to the response
    const response = NextResponse.next();
    
    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Strip Next.js internal headers
    stripNextJsHeaders(response);
    
    return response;
  }
  
  // For non-API routes, add security headers
  const response = NextResponse.next();
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add CSP header
  response.headers.set('Content-Security-Policy', buildCSPHeader(isDev));
  
  // Add HSTS header in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // Strip Next.js internal headers
  stripNextJsHeaders(response);
  
  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/blocks/:path*',
    '/api/categories/:path*',
    '/api/settings/:path*',
    '/api/weather/:path*',
    '/api/health/:path*',
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
};
