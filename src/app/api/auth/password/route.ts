import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, getCookieOptions } from '@/lib/auth';
import { passwordChangeSchema, passwordSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import { ZodError } from 'zod';

const MAX_BODY_SIZE = 1024 * 1024;

export async function PUT(request: Request) {
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
    const validatedData = passwordChangeSchema.parse(body);
    const { currentPassword, newPassword } = validatedData;

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

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Validate new password meets strong requirements
    try {
      passwordSchema.parse(newPassword);
    } catch (passwordError) {
      if (passwordError instanceof ZodError) {
        return NextResponse.json(
          { 
            error: 'New password does not meet security requirements',
            details: passwordError.issues.map(e => e.message),
          },
          { status: 400 }
        );
      }
      throw passwordError;
    }

    // Check that new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Hash and save new password with higher cost
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    // Delete all sessions except current to force re-login elsewhere
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        token: { not: auth.sessionToken },
      },
    });

    const response = NextResponse.json({ 
      success: true, 
      message: 'Password changed successfully. Other sessions have been logged out.' 
    });
    
    // Clear auth cookie to force re-login with new password
    response.cookies.set('auth-token', '', {
      ...getCookieOptions(0),
      maxAge: 0,
    });

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

    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
