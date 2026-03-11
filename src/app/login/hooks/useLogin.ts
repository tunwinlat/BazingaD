import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface LoginFormState { username: string; password: string; totpCode: string; recoveryCode: string; };

export function useLogin() {
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

  return {
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
  };
}
