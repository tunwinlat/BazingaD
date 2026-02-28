import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import * as OTPAuth from 'otpauth';
import { totpVerifySchema } from '@/lib/validation';
import { ZodError } from 'zod';

const MAX_BODY_SIZE = 1024 * 1024;

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

    // Verify authentication
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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
    const validatedData = totpVerifySchema.parse(body);
    const { token: code } = validatedData;

    // Get the authenticated user
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });
    
    if (!user || !user.totpSecret) {
      return NextResponse.json(
        { error: 'TOTP not set up' },
        { status: 400 }
      );
    }

    // Create TOTP object
    const totp = new OTPAuth.TOTP({
      issuer: 'StartPage',
      label: user.username,
      algorithm: 'SHA256',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.totpSecret),
    });

    // Verify the code
    const isValid = totp.validate({ token: code, window: 1 }) !== null;

    if (isValid) {
      // Enable TOTP
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
    } else {
      return NextResponse.json(
        { error: 'Invalid code' },
        { status: 400 }
      );
    }
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

    console.error('TOTP verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
