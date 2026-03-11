'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SetupBackground } from './components/SetupBackground';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SetupForm } from './components/SetupForm';

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if setup is needed
    const checkSetup = async () => {
      try {
        const response = await fetch('/api/auth/setup');
        const data = await response.json();
        
        if (!data.needsSetup) {
          // Setup already done, redirect to login
          router.push('/login');
        } else {
          setLoading(false);
        }
      } catch {
        setError('Failed to check setup status');
        setLoading(false);
      }
    };

    checkSetup();
  }, [router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0f0f1a' }}>
      <SetupBackground />

      <SetupForm initialError={error} />
    </div>
  );
}
