'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogOut, Loader2 } from 'lucide-react';

interface DashboardHeaderProps {
  isAdmin?: boolean;
}

export default function DashboardHeader({ isAdmin }: DashboardHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/dashboard', { method: 'DELETE' });
      router.push('/dashboard-login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex justify-end items-center gap-3 mb-4">
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
        style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        }}
      >
        <Lock className="w-3.5 h-3.5" />
        {isAdmin ? 'Admin Access' : 'Protected'}
      </div>
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {isLoggingOut ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <LogOut className="w-3.5 h-3.5" />
        )}
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}
