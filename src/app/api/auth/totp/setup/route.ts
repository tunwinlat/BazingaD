import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

const MAX_BODY_SIZE = 1024 * 1024;

// Generate a random recovery code
function generateRecoveryCode(): string {
  return randomBytes(16).toString('hex').toUpperCase().match(/.{4}/g)?.join('-') || '';
}

export async function GET() {
  try {
    // Verify authentication
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // If TOTP is already enabled and verified, don't allow new setup
    if (user.totpEnabled && user.totpVerified) {
      return NextResponse.json(
        { error: 'TOTP already enabled' },
        { status: 400 }
      );
    }

    // Generate new TOTP secret
    const secret = new OTPAuth.Secret({ size: 32 });
    
    // Create TOTP object
    const totp = new OTPAuth.TOTP({
      issuer: 'StartPage',
      label: user.username,
      algorithm: 'SHA256',
      digits: 6,
      period: 30,
      secret: secret,
    });

    // Generate QR code URL
    const otpauthUrl = totp.toString();
    
    // Generate QR code image
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#6366f1',
        light: '#ffffff',
      },
    });

    // Generate recovery code
    const recoveryCode = generateRecoveryCode();
    const hashedRecoveryCode = await bcrypt.hash(recoveryCode, 12);

    // Save secret and recovery code (but don't enable yet - need verification first)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totpSecret: secret.base32,
        totpEnabled: false,
        totpVerified: false,
        recoveryCode: hashedRecoveryCode,
      },
    });

    return NextResponse.json({
      qrCode: qrCodeDataUrl,
      secret: secret.base32,
      recoveryCode: recoveryCode, // Show once during setup
    });
  } catch (error) {
    console.error('TOTP setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup TOTP' },
      { status: 500 }
    );
  }
}
