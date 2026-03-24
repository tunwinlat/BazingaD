'use client';

import { Lock, AlertCircle, CheckCircle, Shield, Loader2 } from 'lucide-react';
import { useLogin } from '../hooks/useLogin';
import { LoginBackground } from './LoginBackground';
import { CredentialsInputs } from './CredentialsInputs';
import { TOTPInputs } from './TOTPInputs';

export function LoginForm() {
  const {
    loading,
    submitting,
    error,
    success,
    requireTOTP,
    useRecoveryCode,
    formData,
    setFormData,
    setUseRecoveryCode,
    handleSubmit,
  } = useLogin();

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
      <LoginBackground />

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
              <CredentialsInputs formData={formData} setFormData={setFormData} />
            )}

            {requireTOTP && (
              <TOTPInputs
                useRecoveryCode={useRecoveryCode}
                setUseRecoveryCode={setUseRecoveryCode}
                formData={formData}
                setFormData={setFormData}
              />
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
            >
              {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
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
