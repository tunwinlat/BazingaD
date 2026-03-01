'use client';

import { useRouter } from 'next/navigation';
import { Lock, LogOut } from 'lucide-react';

interface DashboardHeaderProps {
  isAdmin?: boolean;
}

export default function DashboardHeader({ isAdmin }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/dashboard', { method: 'DELETE' });
      router.push('/dashboard-login');
    } catch (error) {
      console.error('Logout error:', error);
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors hover:bg-white/10"
        style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <LogOut className="w-3.5 h-3.5" />
        Logout
      </button>
    </div>
  );
}
