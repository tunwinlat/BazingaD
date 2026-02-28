import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setupSchema, usernameSchema, passwordSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import { ZodError } from 'zod';

const MAX_BODY_SIZE = 1024 * 1024;

export async function GET() {
  try {
    // Check if any user exists
    const userCount = await prisma.user.count();
    return NextResponse.json({ needsSetup: userCount === 0 });
  } catch (error) {
    console.error('Setup check error:', error);
    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    );
  }
}

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

    // Check if setup is already done
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return NextResponse.json(
        { error: 'Setup already completed' },
        { status: 400 }
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

    // Validate input with strong password policy
    const validatedData = setupSchema.parse(body);
    const { username, password } = validatedData;

    // Additional validation (schema already validates, but double-check)
    try {
      usernameSchema.parse(username);
      passwordSchema.parse(password);
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: validationError.issues.map(e => e.message),
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Check for existing username (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username.toLowerCase(),
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
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Admin user created successfully',
      username: user.username 
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
