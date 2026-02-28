import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as OTPAuth from 'otpauth';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
    }

    // Get the first user
    const user = await prisma.user.findFirst();
    
    if (!user || !user.totpSecret) {
      return NextResponse.json({ error: 'TOTP not set up' }, { status: 400 });
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

      return NextResponse.json({ success: true, message: 'TOTP enabled successfully' });
    } else {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }
  } catch (error) {
    console.error('TOTP verify error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
