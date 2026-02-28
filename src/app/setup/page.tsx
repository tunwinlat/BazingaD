'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, User, Lock, AlertCircle } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });

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
      } catch (error) {
        setError('Failed to check setup status');
        setLoading(false);
      }
    };

    checkSetup();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // Check password complexity
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasLowercase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Setup successful, redirect to login
        router.push('/login?setup=success');
      } else {
        // Show detailed validation errors if available
        if (data.details && Array.isArray(data.details)) {
          setError(data.details.join(', '));
        } else {
          setError(data.error || 'Setup failed');
        }
      }
    } catch (error) {
      setError('An error occurred during setup');
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
        {/* Setup Card */}
        <div className="rounded-2xl p-8" style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
        }}>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-white mb-2">
            Initial Setup
          </h1>
          <p className="text-center text-white/60 mb-8">
            Create your admin account to secure the dashboard
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
                  minLength={3}
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
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-white/40 outline-none focus:border-indigo-500"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
            >
              {submitting ? 'Creating Account...' : 'Create Admin Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
