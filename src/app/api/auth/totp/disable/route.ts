import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import * as OTPAuth from 'otpauth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ZodError } from 'zod';

const MAX_BODY_SIZE = 1024 * 1024;

const disableTotpSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  password: z.string().min(1, 'Password is required').max(128, 'Password must not exceed 128 characters'),
});

/**
 * Validates the content length of the request to prevent overly large payloads.
 */
function checkContentLength(request: Request): NextResponse | null {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: 'Request body too large' },
      { status: 413 }
    );
  }
  return null;
}

/**
 * Parses the request body as JSON safely.
 */
async function parseRequestBody(request: Request): Promise<unknown | NextResponse> {
  try {
    return await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }
}

/**
 * Handles errors during the TOTP disable process.
 */
function handleError(error: unknown): NextResponse {
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

  console.error('TOTP disable error:', error);
  return NextResponse.json(
    { error: 'Failed to disable TOTP' },
    { status: 500 }
  );
}

/**
 * Validates the TOTP code against the user's secret.
 */
function verifyTotpCode(username: string, secretBase32: string, code: string): NextResponse | null {
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: 'Invalid TOTP code format' },
      { status: 400 }
    );
  }

  const totp = new OTPAuth.TOTP({
    issuer: 'StartPage',
    label: username,
    algorithm: 'SHA256',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });

  const isValid = totp.validate({ token: code, window: 1 }) !== null;
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid code' },
      { status: 400 }
    );
  }

  return null;
}

/**
 * Validates the Recovery code against the user's hashed recovery code.
 */
async function verifyRecoveryCode(code: string, hashedCode: string): Promise<NextResponse | null> {
  const isRecoveryValid = await bcrypt.compare(code.toUpperCase(), hashedCode);
  if (!isRecoveryValid) {
    return NextResponse.json(
      { error: 'Invalid recovery code' },
      { status: 400 }
    );
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const contentLengthError = checkContentLength(request);
    if (contentLengthError) return contentLengthError;

    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await parseRequestBody(request);
    if (body instanceof NextResponse) return body;

    const validatedData = disableTotpSchema.parse(body);
    const { code, password } = validatedData;

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        username: true,
        password: true,
        totpEnabled: true,
        totpSecret: true,
        recoveryCode: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Check if using recovery code (recovery codes are longer than 6 chars)
    if (code.length > 6 && user.recoveryCode) {
      const recoveryError = await verifyRecoveryCode(code, user.recoveryCode);
      if (recoveryError) return recoveryError;
    } else if (user.totpSecret) {
      const totpError = verifyTotpCode(user.username, user.totpSecret, code);
      if (totpError) return totpError;
    } else {
      return NextResponse.json(
        { error: 'TOTP is not enabled' },
        { status: 400 }
      );
    }

    // Disable TOTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totpSecret: null,
        totpEnabled: false,
        totpVerified: false,
        recoveryCode: null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'TOTP disabled successfully' 
    });
  } catch (error) {
    return handleError(error);
  }
}
