import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as OTPAuth from 'otpauth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { code, password } = await request.json();

    // Get the first user
    const user = await prisma.user.findFirst();
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify password first
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Check if using recovery code
    if (code.length > 6 && user.recoveryCode) {
      const isRecoveryValid = await bcrypt.compare(code.toUpperCase(), user.recoveryCode);
      if (!isRecoveryValid) {
        return NextResponse.json({ error: 'Invalid recovery code' }, { status: 400 });
      }
    } else if (user.totpSecret) {
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
        return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
      }
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

    return NextResponse.json({ success: true, message: 'TOTP disabled successfully' });
  } catch (error) {
    console.error('TOTP disable error:', error);
    return NextResponse.json({ error: 'Failed to disable TOTP' }, { status: 500 });
  }
}
