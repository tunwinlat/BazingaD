'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogOut } from 'lucide-react';
import Background from '@/components/Background';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import Footer from '@/components/Footer';
import Weather from '@/components/Weather';

export default function Home() {
  const router = useRouter();
  const [isProtected, setIsProtected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProtection = async () => {
      try {
        const response = await fetch('/api/auth/dashboard');
        const data = await response.json();
        
        if (data.protected && !data.hasAccess) {
          // Protected and no access, redirect to login
          router.push('/dashboard-login');
        } else {
          setIsProtected(data.protected);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setLoading(false);
      }
    };

    checkProtection();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/dashboard', { method: 'DELETE' });
      router.push('/dashboard-login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f0f1a' }}>
        <div className="w-10 h-10 border-3 rounded-full animate-spin"
          style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#6366f1' }} />
      </div>
    );
  }

  return (
    <>
      <Background />
      <div className="min-h-screen px-4 py-8 md:py-10 flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex flex-col flex-1">
          {/* Protected indicator and logout */}
          {isProtected && (
            <div className="flex justify-end items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <Lock className="w-3.5 h-3.5" />
                Protected
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors hover:bg-white/10"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          )}
          
          {/* Weather Widget */}
          <Weather />
          
          <Header />
          <Dashboard />
          <Footer />
        </div>
      </div>
    </>
  );
}
