import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

// Session configuration
const SESSION_DURATION_HOURS = 24;
const SESSION_DURATION_MS = SESSION_DURATION_HOURS * 60 * 60 * 1000;
const SESSION_DURATION_SECONDS = SESSION_DURATION_HOURS * 60 * 60;

// Maximum session duration: 12 months (in hours)
export const MAX_SESSION_DURATION_HOURS = 8760; // 365 * 24

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
 * @param userId - The user ID to create the session for
 * @param durationHours - Optional custom session duration in hours (defaults to 24 hours, max 12 months)
 */
export async function createSession(userId: string, durationHours?: number): Promise<string> {
  const token = generateSessionToken();
  
  // Use provided duration or default, clamped to maximum
  const effectiveDurationHours = Math.min(
    durationHours ?? SESSION_DURATION_HOURS,
    MAX_SESSION_DURATION_HOURS
  );
  const durationMs = effectiveDurationHours * 60 * 60 * 1000;
  
  const expiresAt = new Date(Date.now() + durationMs);
  
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
 * @param maxAge - Max age in seconds (not milliseconds)
 */
export function getCookieOptions(maxAgeSeconds?: number) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Check if we're running in a container without HTTPS
  // In Docker, we typically don't have HTTPS, so we need to allow non-secure cookies
  const isDocker = process.env.DOCKER_ENV === 'true' || !process.env.VERCEL;
  
  return {
    httpOnly: true,
    secure: isProduction && !isDocker, // Only secure in production if not in Docker
    sameSite: 'strict' as const, // Strict for maximum CSRF protection
    path: '/',
    maxAge: maxAgeSeconds ?? SESSION_DURATION_SECONDS,
  };
}
