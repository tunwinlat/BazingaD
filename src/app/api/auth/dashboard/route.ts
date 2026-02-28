import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// Check if dashboard is protected
export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    
    // Check if user has dashboard access cookie
    const cookieStore = await cookies();
    const dashboardToken = cookieStore.get('dashboard-token')?.value;
    
    let hasAccess = false;
    if (dashboardToken) {
      const session = await prisma.session.findUnique({
        where: { token: dashboardToken },
        include: { user: true },
      });
      
      if (session && session.expiresAt > new Date()) {
        hasAccess = true;
      }
    }
    
    // Also grant access if user has admin auth
    const adminToken = cookieStore.get('auth-token')?.value;
    if (adminToken) {
      const adminSession = await prisma.session.findUnique({
        where: { token: adminToken },
      });
      
      if (adminSession && adminSession.expiresAt > new Date()) {
        hasAccess = true;
      }
    }

    return NextResponse.json({
      protected: settings?.dashboardProtected ?? false,
      hasAccess,
    });
  } catch (error) {
    console.error('Dashboard auth check error:', error);
    return NextResponse.json({ error: 'Failed to check auth' }, { status: 500 });
  }
}

// Login to dashboard
export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    const settings = await prisma.settings.findFirst();
    
    if (!settings?.dashboardProtected) {
      return NextResponse.json({ error: 'Dashboard is not protected' }, { status: 400 });
    }
    
    if (!settings.dashboardPassword) {
      return NextResponse.json({ error: 'No password set' }, { status: 500 });
    }
    
    const isValid = await bcrypt.compare(password, settings.dashboardPassword);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    
    // Create session
    const token = Buffer.from(`dashboard:${Date.now()}:${Math.random()}`).toString('base64');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (settings.sessionDurationHours || 24));
    
    // Get first user for session relation
    const user = await prisma.user.findFirst();
    if (user) {
      await prisma.session.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });
    }
    
    const response = NextResponse.json({ success: true });
    
    // Set cookie
    response.cookies.set('dashboard-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: (settings.sessionDurationHours || 24) * 60 * 60,
    });
    
    return response;
  } catch (error) {
    console.error('Dashboard login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
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
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });
    
    return response;
  } catch (error) {
    console.error('Dashboard logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
