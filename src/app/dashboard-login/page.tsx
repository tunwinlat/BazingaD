'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f0f1a' }}>
      <div className="w-10 h-10 border-3 rounded-full animate-spin"
        style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#6366f1' }} />
    </div>
  );
}

function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute rounded-full animate-float"
        style={{
          width: '600px', height: '600px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          top: '-200px', right: '-100px',
          filter: 'blur(80px)', opacity: 0.5,
        }}
      />
      <div className="absolute rounded-full animate-float"
        style={{
          width: '500px', height: '500px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #10b981 100%)',
          bottom: '-150px', left: '-100px',
          filter: 'blur(80px)', opacity: 0.5,
          animationDelay: '-7s',
        }}
      />
    </div>
  );
}

function LoginCard({
  error,
  password,
  setPassword,
  submitting,
  handleSubmit
}: {
  error: string;
  password: string;
  setPassword: (password: string) => void;
  submitting: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md">
      {/* Login Card */}
      <div className="rounded-2xl p-8" style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-white mb-2">
          Dashboard Protected
        </h1>
        <p className="text-center text-white/60 mb-8">
          Enter the dashboard password to continue
        </p>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg mb-6"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="dashboard-password" className="block text-sm text-white/70 mb-2">Password</label>
            <div className="relative">
              <input
                id="dashboard-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-12 py-3 rounded-lg text-white placeholder-white/40 outline-none focus:border-indigo-500"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                placeholder="Enter dashboard password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
            {submitting ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function DashboardLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Check if already authenticated or if protection is disabled
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/dashboard');
        const data = await response.json();

        if (!data.protected || data.hasAccess) {
          // Not protected or already has access, redirect to home
          router.push('/');
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful, redirect to home
        router.push('/');
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0f0f1a' }}>
      <Background />
      <LoginCard
        error={error}
        password={password}
        setPassword={setPassword}
        submitting={submitting}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
