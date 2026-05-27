import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, getCookieOptions } from '@/lib/auth';
import { settingsCache } from '@/lib/cache';
import { loginSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import { ZodError } from 'zod';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const MAX_BODY_SIZE = 1024 * 1024;

const loginRateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 15 * 60, // 15 minutes
});

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

async function verifyTOTP(user: TOTPUser, totpToken: string | undefined): Promise<NextResponse | null> {
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
    try {
      await loginRateLimiter.consume(user.username.toLowerCase());
    } catch {
      // Ignore
    }
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
    if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
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
    const normalizedUsername = username.toLowerCase();

    // Check for lockout (using username as identifier)
    try {
      const res = await loginRateLimiter.get(normalizedUsername);
      if (res !== null && res.consumedPoints >= 5) {
        return NextResponse.json(
          { error: 'Account temporarily locked due to too many failed attempts. Please try again later.' },
          { status: 429 }
        );
      }
    } catch {
      // Ignore
    }

    // Find user (select only needed fields)
    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: {
        id: true,
        username: true,
        password: true,
        totpEnabled: true,
        totpVerified: true,
        totpSecret: true,
      },
    });

    if (!user) {
      // Perform a real hash to ensure constant time behavior and prevent user enumeration
      // compared to a static dummy hash which may leak timing differences.
      await bcrypt.hash(password, 12);

      try {
        await loginRateLimiter.consume(normalizedUsername);
      } catch {
        // Ignore
      }
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      try {
        await loginRateLimiter.consume(normalizedUsername);
      } catch {
        // Ignore
      }
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify TOTP code if enabled
    const totpResponse = await verifyTOTP(user, totpToken);
    if (totpResponse) {
      return totpResponse;
    }

    // Clear failed attempts on successful login
    await loginRateLimiter.delete(normalizedUsername);

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
