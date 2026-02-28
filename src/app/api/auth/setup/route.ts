import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Check if any user exists
    const userCount = await prisma.user.count();
    return NextResponse.json({ needsSetup: userCount === 0 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check setup status' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Check if setup is already done
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return NextResponse.json({ error: 'Setup already completed' }, { status: 400 });
    }

    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

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
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 });
  }
}
