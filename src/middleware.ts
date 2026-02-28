import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the request is for admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      // Not authenticated, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
