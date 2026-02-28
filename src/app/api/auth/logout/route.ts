import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getCookieOptions } from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    // Delete session from database if token exists
    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }
    
    const response = NextResponse.json({ success: true });
    
    // Clear auth cookie with secure options
    response.cookies.set('auth-token', '', {
      ...getCookieOptions(0),
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
