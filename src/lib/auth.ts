import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');
  
  if (!token) {
    redirect('/login');
  }
}

export async function checkSetup() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/setup', {
      cache: 'no-store',
    });
    const data = await response.json();
    
    if (data.needsSetup) {
      redirect('/setup');
    }
  } catch (error) {
    // If API call fails, assume setup is done to avoid redirect loops
    console.error('Failed to check setup:', error);
  }
}
