import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

// Session configuration
const SESSION_DURATION_HOURS = 24;
const SESSION_DURATION_MS = SESSION_DURATION_HOURS * 60 * 60 * 1000;

/**
 * Generate a cryptographically secure session token
 * Uses Web Crypto API for Edge runtime compatibility
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify authentication from cookies (Server Component/API Route version)
 */
export async function verifyAuth(): Promise<{ userId: string; sessionToken: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) return null;
    
    // Find session with user
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    
    if (!session) return null;
    
    // Check if session has expired
    if (new Date() > session.expiresAt) {
      // Delete expired session
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }
    
    // Check if password was changed after session creation
    if (session.user.passwordChangedAt > session.createdAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }
    
    return { userId: session.userId, sessionToken: token };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

/**
 * Verify authentication from request (Middleware/API Route version)
 */
export async function verifyAuthFromRequest(request: NextRequest): Promise<{ userId: string; sessionToken: string } | null> {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) return null;
    
    // Find session with user
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    
    if (!session) return null;
    
    // Check if session has expired
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }
    
    // Check if password was changed after session creation
    if (session.user.passwordChangedAt > session.createdAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }
    
    return { userId: session.userId, sessionToken: token };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
  
  return token;
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { token },
  });
}

/**
 * Delete all sessions for a user (force logout everywhere)
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

/**
 * Extend session expiration (sliding session)
 */
export async function extendSession(token: string): Promise<void> {
  const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  
  await prisma.session.update({
    where: { token },
    data: { expiresAt: newExpiresAt },
  });
}

/**
 * Get secure cookie options based on environment
 */
export function getCookieOptions(maxAge?: number) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction, // Only secure in production
    sameSite: 'strict' as const,
    path: '/',
    maxAge: maxAge ?? SESSION_DURATION_MS,
  };
}
