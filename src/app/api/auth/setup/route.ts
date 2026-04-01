import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { usernameSchema, passwordSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import { ZodError } from 'zod';

const MAX_BODY_SIZE = 1024 * 1024;

let isSetupComplete = false;

async function checkSetupComplete() {
  if (isSetupComplete) {
    return true;
  }
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    isSetupComplete = true;
  }
  return isSetupComplete;
}

export async function GET() {
  try {
    // Check if any user exists
    const setupDone = await checkSetupComplete();
    return NextResponse.json({ needsSetup: !setupDone });
  } catch (error) {
    console.error('Setup check error:', error);
    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    );
  }
}

async function createAdminUser(username: string, password: string) {
  const normalizedUsername = username.toLowerCase();

  // Check for existing username (case-insensitive)
  const existingUser = await prisma.user.findFirst({
    where: {
      username: {
        equals: normalizedUsername,
      },
    },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: 'Username already exists' },
      { status: 409 }
    );
  }

  // Hash password with higher cost factor
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  await prisma.user.create({
    data: {
      username: normalizedUsername,
      password: hashedPassword,
    },
  });

  // Mark setup as complete in memory
  isSetupComplete = true;

  return null;
}

async function validateSetupRequest(request: Request) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: 'Request body too large' },
      { status: 413 }
    );
  }

  const setupDone = await checkSetupComplete();
  if (setupDone) {
    return NextResponse.json(
      { error: 'Setup already completed' },
      { status: 400 }
    );
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const validationErrorResponse = await validateSetupRequest(request);
    if (validationErrorResponse) {
      return validationErrorResponse;
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

    // Validate input - extract fields from body
    const { username, password } = body;

    // Validate username and password
    usernameSchema.parse(username);
    passwordSchema.parse(password);

    const response = await createAdminUser(username, password);
    if (response) {
      return response;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Admin user created successfully',
      username: username.toLowerCase()
    }, { status: 201 });
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

    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}
