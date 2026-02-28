import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthFromRequest } from './lib/auth';
import { rateLimitMiddleware } from './lib/rate-limiter';

// Security headers to add to all responses
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// CSP header - adjust as needed for your application
const cspHeader = `
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
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
  }
  
  // Check authentication for admin routes
  if (pathname.startsWith('/admin')) {
    const auth = await verifyAuthFromRequest(request);
    
    if (!auth) {
      // Not authenticated, redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      
      // Clear invalid auth cookie if present
      response.cookies.delete('auth-token');
      
      return response;
    }
  }
  
  // Check authentication for protected API routes
  const protectedApiRoutes = [
    '/api/blocks',
    '/api/categories',
    '/api/settings',
    '/api/weather',
  ];
  
  const isProtectedApiRoute = protectedApiRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isProtectedApiRoute && request.method !== 'GET') {
    const auth = await verifyAuthFromRequest(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  // Create response with security headers
  const response = NextResponse.next();
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add CSP header
  response.headers.set('Content-Security-Policy', cspHeader);
  
  // Add HSTS header in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
