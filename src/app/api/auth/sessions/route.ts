import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all active sessions
export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const activeSessions = sessions
      .filter(s => s.expiresAt > now)
      .map(s => ({
        id: s.id,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        username: s.user.username,
      }));

    return NextResponse.json({ sessions: activeSessions, count: activeSessions.length });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// Logout all sessions
export async function DELETE() {
  try {
    await prisma.session.deleteMany({});
    
    const response = NextResponse.json({ success: true, message: 'All sessions logged out' });
    
    // Clear all auth cookies
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });
    
    response.cookies.set('dashboard-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });
    
    return response;
  } catch (error) {
    console.error('Logout all error:', error);
    return NextResponse.json({ error: 'Failed to logout sessions' }, { status: 500 });
  }
}
