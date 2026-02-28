import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  // Delete session from database
  if (token) {
    await prisma.session.deleteMany({
      where: { token },
    });
  }
  
  const response = NextResponse.json({ success: true });
  
  // Clear auth cookie
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
  });

  return response;
}
