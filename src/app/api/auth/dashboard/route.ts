import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, createSession, getCookieOptions } from '@/lib/auth';
import { settingsCache } from '@/lib/cache';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

const MAX_BODY_SIZE = 1024 * 1024;
const CACHE_KEY = 'dashboard_auth_settings';

const dashboardLoginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

// Check if dashboard is protected
export async function GET() {
  try {
    let dashboardProtected = settingsCache.get<boolean>(CACHE_KEY);

    if (dashboardProtected === null || dashboardProtected === undefined) {
      const settings = await prisma.settings.findFirst({
        select: { dashboardProtected: true }
      });
      dashboardProtected = settings?.dashboardProtected ?? false;
      settingsCache.set(CACHE_KEY, dashboardProtected, 60);
    }
    
    // Check if user has admin auth (admins always have dashboard access)
    const auth = await verifyAuth();
    const hasAdminAccess = !!auth;
    
    // Check dashboard-specific access
    const cookieStore = await cookies();
    const dashboardToken = cookieStore.get('dashboard-token')?.value;
    
    let hasDashboardAccess = false;
    if (dashboardToken) {
      const session = await prisma.session.findUnique({
        where: { token: dashboardToken },
      });
      
      if (session && session.expiresAt > new Date()) {
        hasDashboardAccess = true;
      }
    }

    return NextResponse.json({
      protected: dashboardProtected,
      hasAccess: hasAdminAccess || hasDashboardAccess,
      isAdmin: hasAdminAccess,
    });
  } catch (error) {
    console.error('Dashboard auth check error:', error);
    return NextResponse.json(
      { error: 'Failed to check auth' },
      { status: 500 }
    );
  }
}

// Login to dashboard
export async function POST(request: Request) {
  try {
    // Check content length
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate input
    const validatedData = dashboardLoginSchema.parse(body);
    const { password } = validatedData;
    
    let dashboardProtected = settingsCache.get<boolean>(CACHE_KEY);

    if (dashboardProtected === null || dashboardProtected === undefined) {
      const dbSettings = await prisma.settings.findFirst({
        select: { dashboardProtected: true }
      });
      dashboardProtected = dbSettings?.dashboardProtected ?? false;
      settingsCache.set(CACHE_KEY, dashboardProtected, 60);
    }
    
    if (!dashboardProtected) {
      return NextResponse.json(
        { error: 'Dashboard is not protected' },
        { status: 400 }
      );
    }
    
    const settings = await prisma.settings.findFirst();

    if (!settings?.dashboardPassword) {
      return NextResponse.json(
        { error: 'No password set' },
        { status: 500 }
      );
    }
    
    const isValid = await bcrypt.compare(password, settings.dashboardPassword);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
    
    // Get first user for session relation
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json(
        { error: 'No user found' },
        { status: 500 }
      );
    }

    // Get session duration from settings
    const sessionDurationHours = settings.sessionDurationHours || 24;
    
    // Create session using auth utility with the configured duration
    const token = await createSession(user.id, sessionDurationHours);
    
    const response = NextResponse.json({ success: true });
    
    // Set cookie with secure options
    response.cookies.set('dashboard-token', token, getCookieOptions(
      sessionDurationHours * 60 * 60
    ));
    
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.issues.map(e => e.message),
        },
        { status: 400 }
      );
    }

    console.error('Dashboard login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

// Logout from dashboard
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('dashboard-token')?.value;
    
    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }
    
    const response = NextResponse.json({ success: true });
    response.cookies.set('dashboard-token', '', {
      ...getCookieOptions(0),
      maxAge: 0,
    });
    
    return response;
  } catch (error) {
    console.error('Dashboard logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
