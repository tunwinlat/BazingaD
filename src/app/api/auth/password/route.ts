import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json();

    // Get the first user
    const user = await prisma.user.findFirst();
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    // Delete all sessions to force re-login
    await prisma.session.deleteMany({});

    const response = NextResponse.json({ 
      success: true, 
      message: 'Password changed successfully. All sessions have been logged out.' 
    });
    
    // Clear auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
