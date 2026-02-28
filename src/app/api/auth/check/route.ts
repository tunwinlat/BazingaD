import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // For this simple implementation, just check if token exists
    // In production, you'd verify the JWT or session
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
