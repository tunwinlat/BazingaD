import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, getCookieOptions, deleteAllUserSessions } from '@/lib/auth';

// Get all active sessions for the authenticated user
export async function GET() {
  try {
    // Verify authentication
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const sessions = await prisma.session.findMany({
      where: {
        userId: auth.userId,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        token: true,
      },
    });

    const activeSessions = sessions.map(s => ({
      id: s.id,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.token === auth.sessionToken,
    }));

    return NextResponse.json({ 
      sessions: activeSessions, 
      count: activeSessions.length 
    });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// Logout all sessions for the authenticated user
export async function DELETE() {
  try {
    // Verify authentication
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete all sessions for this user
    await deleteAllUserSessions(auth.userId);
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'All sessions logged out' 
    });
    
    // Clear auth cookie
    response.cookies.set('auth-token', '', {
      ...getCookieOptions(0),
      maxAge: 0,
    });
    
    return response;
  } catch (error) {
    console.error('Logout all error:', error);
    return NextResponse.json(
      { error: 'Failed to logout sessions' },
      { status: 500 }
    );
  }
}
