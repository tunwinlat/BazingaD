import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import * as OTPAuth from 'otpauth';
import { totpVerifySchema } from '@/lib/validation';
import { ZodError } from 'zod';

const MAX_BODY_SIZE = 1024 * 1024;

/**
 * Validates the content length of the request to prevent overly large payloads.
 */
function checkContentLength(request: Request): NextResponse | null {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
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
 * Validates the TOTP code against the user's secret.
 */
function verifyTotpCode(username: string, secretBase32: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: 'StartPage',
    label: username,
    algorithm: 'SHA256',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });

  return totp.validate({ token: code, window: 1 }) !== null;
}

/**
 * Handles errors during the TOTP verification process.
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

  console.error('TOTP verify error:', error);
  return NextResponse.json(
    { error: 'Verification failed' },
    { status: 500 }
  );
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

    const { token: code } = totpVerifySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });
    
    if (!user || !user.totpSecret) {
      return NextResponse.json(
        { error: 'TOTP not set up' },
        { status: 400 }
      );
    }

    const isValid = verifyTotpCode(user.username, user.totpSecret, code);

    if (isValid) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          totpEnabled: true,
          totpVerified: true,
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'TOTP enabled successfully' 
      });
    }

    return NextResponse.json(
      { error: 'Invalid code' },
      { status: 400 }
    );
  } catch (error) {
    return handleError(error);
  }
}
