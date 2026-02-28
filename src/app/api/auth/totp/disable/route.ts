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
  password: z.string().min(1, 'Password is required'),
});

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
    const validatedData = disableTotpSchema.parse(body);
    const { code, password } = validatedData;

    // Get the authenticated user
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify password first
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Check if using recovery code (recovery codes are longer than 6 chars)
    if (code.length > 6 && user.recoveryCode) {
      const isRecoveryValid = await bcrypt.compare(code.toUpperCase(), user.recoveryCode);
      if (!isRecoveryValid) {
        return NextResponse.json(
          { error: 'Invalid recovery code' },
          { status: 400 }
        );
      }
    } else if (user.totpSecret) {
      // Validate TOTP code format
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json(
          { error: 'Invalid TOTP code format' },
          { status: 400 }
        );
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

      const isValid = totp.validate({ token: code, window: 1 }) !== null;
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid code' },
          { status: 400 }
        );
      }
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
}
