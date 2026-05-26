import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, getCookieOptions } from '@/lib/auth';
import { passwordChangeSchema, passwordSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import { ZodError } from 'zod';

const MAX_BODY_SIZE = 1024 * 1024;

interface ValidationResult<T> {
  data?: T;
  error?: NextResponse;
}

// Check content length to prevent large payloads
function validateContentLength(request: Request): NextResponse | null {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: 'Request body too large' },
      { status: 413 }
    );
  }
  return null;
}

// Extract and parse JSON body
async function parseRequestBody(request: Request): Promise<ValidationResult<unknown>> {
  try {
    const body = await request.json();
    return { data: body };
  } catch {
    return {
      error: NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    };
  }
}

// Validate new password rules and difference from current
async function validateNewPasswordParams(newPassword: string, userPasswordHash: string): Promise<NextResponse | null> {
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
  const isSamePassword = await bcrypt.compare(newPassword, userPasswordHash);
  if (isSamePassword) {
    return NextResponse.json(
      { error: 'New password must be different from current password' },
      { status: 400 }
    );
  }

  return null;
}

// Perform the DB updates and session management
async function updatePasswordAndSessions(userId: string, newPassword: string) {
  // Hash and save new password with higher cost
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    },
  });

  // Delete ALL sessions to force re-login everywhere with the new password
  await prisma.session.deleteMany({
    where: { userId: userId },
  });
}

// Helper to handle general Zod validation errors safely
function handleZodError(error: unknown) {
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
  return null;
}

export async function PUT(request: Request) {
  try {
    const lengthError = validateContentLength(request);
    if (lengthError) return lengthError;

    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: body, error: bodyError } = await parseRequestBody(request);
    if (bodyError) return bodyError;

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

    const newPasswordError = await validateNewPasswordParams(newPassword, user.password);
    if (newPasswordError) return newPasswordError;

    await updatePasswordAndSessions(user.id, newPassword);

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
    const zodErrorResponse = handleZodError(error);
    if (zodErrorResponse) return zodErrorResponse;

    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
