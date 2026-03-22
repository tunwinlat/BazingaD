import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, getCookieOptions } from '@/lib/auth';
import { settingsCache } from '@/lib/cache';
import { loginSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import { ZodError } from 'zod';

const MAX_BODY_SIZE = 1024 * 1024;

// Track failed login attempts in memory (for rate limiting)
// In production, use Redis or database
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function isLockedOut(identifier: string): boolean {
  const attempt = failedAttempts.get(identifier);
  if (!attempt) return false;

  if (attempt.count >= MAX_FAILED_ATTEMPTS) {
    const timeSinceLastAttempt = Date.now() - attempt.lastAttempt;
    if (timeSinceLastAttempt < LOCKOUT_DURATION_MS) {
      return true;
    }
    // Reset after lockout period
    failedAttempts.delete(identifier);
  }
  return false;
}

function recordFailedAttempt(identifier: string): void {
  // 🛡️ Sentinel: Prevent memory exhaustion (DoS) by capping map size
  if (failedAttempts.size >= 10000) {
    const now = Date.now();
    for (const [key, attempt] of failedAttempts.entries()) {
      if (now - attempt.lastAttempt > LOCKOUT_DURATION_MS) {
        failedAttempts.delete(key);
      }
    }
    // If still too large, forcefully clear older entries
    if (failedAttempts.size >= 10000) {
      failedAttempts.clear();
    }
  }

  const existing = failedAttempts.get(identifier);
  if (existing) {
    existing.count++;
    existing.lastAttempt = Date.now();
  } else {
    failedAttempts.set(identifier, { count: 1, lastAttempt: Date.now() });
  }
}

function recordSuccessfulAttempt(identifier: string): void {
  failedAttempts.delete(identifier);
}

async function getSessionDurationHours(): Promise<number> {
  const CACHE_KEY = 'general_settings';

  // Try to get from cache first
  const cachedSettings = settingsCache.get<{ sessionDurationHours?: number }>(CACHE_KEY);

  if (cachedSettings && cachedSettings.sessionDurationHours !== undefined) {
    return cachedSettings.sessionDurationHours;
  }

  // Fallback to database
  const settings = await prisma.settings.findFirst();
  const sessionHours = settings?.sessionDurationHours || 24;

  // Update cache with the full settings object
  if (settings) {
    settingsCache.set(CACHE_KEY, settings, 60);
  }

  return sessionHours;
}

// Minimal interface for the user object needed by verifyTOTP
interface TOTPUser {
  username: string;
  totpEnabled: boolean;
  totpVerified: boolean;
  totpSecret: string | null;
}

function verifyTOTP(user: TOTPUser, totpToken: string | undefined): NextResponse | null {
  if (!user.totpEnabled || !user.totpVerified || !user.totpSecret) {
    return null;
  }

  // If no TOTP code provided, ask for it
  if (!totpToken) {
    return NextResponse.json({
      requireTOTP: true,
      message: 'Two-factor authentication required'
    }, { status: 202 });
  }

  // Verify TOTP code
  const totp = new OTPAuth.TOTP({
    issuer: 'StartPage',
    label: user.username,
    algorithm: 'SHA256',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(user.totpSecret),
  });

  const isTOTPValid = totp.validate({ token: totpToken, window: 1 }) !== null;
  if (!isTOTPValid) {
    recordFailedAttempt(user.username.toLowerCase());
    return NextResponse.json(
      { error: 'Invalid authentication code' },
      { status: 401 }
    );
  }

  return null;
}

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
    const validatedData = loginSchema.parse(body);
    const { username, password, totpToken } = validatedData;

    // Check for lockout (using username as identifier)
    if (isLockedOut(username.toLowerCase())) {
      return NextResponse.json(
        { error: 'Account temporarily locked due to too many failed attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      // Dummy compare to prevent timing attacks for user enumeration
      // Using a valid bcrypt hash (cost 12) of a random string
      const dummyHash = '$2a$12$00000000000000000000000000000000000000000000000000000';
      await bcrypt.compare(password, dummyHash);

      recordFailedAttempt(username.toLowerCase());
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      recordFailedAttempt(username.toLowerCase());
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify TOTP code if enabled
    const totpResponse = verifyTOTP(user, totpToken);
    if (totpResponse) {
      return totpResponse;
    }

    // Clear failed attempts on successful login
    recordSuccessfulAttempt(username.toLowerCase());

    // Get session duration from settings
    const sessionHours = await getSessionDurationHours();

    // Create session with the configured duration
    const token = await createSession(user.id, sessionHours);

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      username: user.username
    });

    response.cookies.set('auth-token', token, getCookieOptions(sessionHours * 60 * 60));

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed', details: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
