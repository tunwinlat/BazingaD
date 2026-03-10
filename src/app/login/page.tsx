'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, AlertCircle, CheckCircle, Shield } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requireTOTP, setRequireTOTP] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    totpCode: '',
    recoveryCode: '',
  });

  useEffect(() => {
    // Check if setup is needed
    const checkSetup = async () => {
      try {
        const response = await fetch('/api/auth/setup');
        const data = await response.json();
        
        if (data.needsSetup) {
          // Setup needed, redirect to setup
          router.push('/setup');
          return;
        }
      } catch (error) {
        console.error('Failed to check setup:', error);
      }
      
      // Check for success message
      if (searchParams.get('setup') === 'success') {
        setSuccess('Account created successfully! Please log in.');
      }
      if (searchParams.get('logout') === 'success') {
        setSuccess('You have been logged out.');
      }
      
      setLoading(false);
    };

    checkSetup();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload: Record<string, string> = {
        username: formData.username,
        password: formData.password,
      };

      // If TOTP is required, add the code
      if (requireTOTP) {
        if (useRecoveryCode) {
          payload.recoveryCode = formData.recoveryCode;
        } else {
          payload.totpToken = formData.totpCode;
        }
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 202 && data.requireTOTP) {
        // TOTP required
        setRequireTOTP(true);
        setSubmitting(false);
        return;
      }

      if (response.ok) {
        // Login successful, redirect to admin
        // Use window.location for full page reload to ensure cookie is sent
        window.location.href = '/admin';
      } else {
        // Show detailed validation errors if available
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((d: {field?: string; message?: string} | string) => 
            typeof d === 'string' ? d : d.message
          );
          setError(errorMessages.join(', '));
        } else {
          setError(data.error || 'Login failed');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
    } finally {
      setSubmitting(false);
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0f0f1a' }}>
      {/* Background */}
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
              {requireTOTP ? <Shield className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-white mb-2">
            {requireTOTP ? 'Two-Factor Authentication' : 'Admin Login'}
          </h1>
          <p className="text-center text-white/60 mb-8">
            {requireTOTP 
              ? (useRecoveryCode ? 'Enter your recovery code' : 'Enter the 6-digit code from your authenticator app')
              : 'Enter your credentials to access the dashboard'
            }
          </p>

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg mb-6"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

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
            {!requireTOTP && (
              <>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-white/40 outline-none focus:border-indigo-500"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      placeholder="Enter username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-white/40 outline-none focus:border-indigo-500"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {requireTOTP && (
              <>
                {useRecoveryCode ? (
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Recovery Code</label>
                    <input
                      type="text"
                      value={formData.recoveryCode}
                      onChange={(e) => setFormData({ ...formData, recoveryCode: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 rounded-lg text-white placeholder-white/40 outline-none focus:border-indigo-500 font-mono tracking-wider"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-white/70 mb-2">6-Digit Code</label>
                    <input
                      type="text"
                      value={formData.totpCode}
                      onChange={(e) => setFormData({ ...formData, totpCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      className="w-full px-4 py-3 rounded-lg text-white placeholder-white/40 outline-none focus:border-indigo-500 text-center text-2xl tracking-[0.5em] font-mono"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setUseRecoveryCode(!useRecoveryCode);
                    setFormData({ ...formData, totpCode: '', recoveryCode: '' });
                  }}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {useRecoveryCode ? 'Use authenticator code instead' : 'Use recovery code instead'}
                </button>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
            >
              {submitting 
                ? (requireTOTP ? 'Verifying...' : 'Logging in...') 
                : (requireTOTP ? 'Verify' : 'Log In')
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f0f1a' }}>
        <div className="w-10 h-10 border-3 rounded-full animate-spin"
          style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#6366f1' }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
