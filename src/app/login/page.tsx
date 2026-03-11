'use client';

import { Suspense } from 'react';
import { LoginForm } from './components/LoginForm';

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
