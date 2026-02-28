import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';

export async function POST(request: Request) {
  try {
    const { username, password, totpCode, recoveryCode } = await request.json();

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if TOTP is enabled
    if (user.totpEnabled && user.totpVerified && user.totpSecret) {
      // If no TOTP code or recovery code provided, ask for it
      if (!totpCode && !recoveryCode) {
        return NextResponse.json({ 
          requireTOTP: true,
          message: 'Two-factor authentication required'
        }, { status: 202 });
      }

      // Verify TOTP code
      if (totpCode) {
        const totp = new OTPAuth.TOTP({
          issuer: 'StartPage',
          label: user.username,
          algorithm: 'SHA256',
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(user.totpSecret),
        });

        const isTOTPValid = totp.validate({ token: totpCode, window: 1 }) !== null;
        if (!isTOTPValid) {
          return NextResponse.json({ error: 'Invalid authentication code' }, { status: 401 });
        }
      }
      // Or verify recovery code
      else if (recoveryCode && user.recoveryCode) {
        const isRecoveryValid = await bcrypt.compare(recoveryCode.toUpperCase(), user.recoveryCode);
        if (!isRecoveryValid) {
          return NextResponse.json({ error: 'Invalid recovery code' }, { status: 401 });
        }
      }
    }

    // Get session duration from settings
    const settings = await prisma.settings.findFirst();
    const sessionHours = settings?.sessionDurationHours || 24;

    // Create session in database
    const token = Buffer.from(`${user.username}:${Date.now()}:${Math.random()}`).toString('base64');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + sessionHours);
    
    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });
    
    // Set HTTP-only cookie
    const response = NextResponse.json({ 
      success: true, 
      username: user.username 
    });
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: sessionHours * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
