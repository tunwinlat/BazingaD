import { useState } from 'react';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import type { LoginFormState } from '../hooks/useLogin';

interface CredentialsInputsProps {
  formData: LoginFormState;
  setFormData: React.Dispatch<React.SetStateAction<LoginFormState>>;
}

export function CredentialsInputs({ formData, setFormData }: CredentialsInputsProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <div>
        <label htmlFor="username" className="block text-sm text-white/70 mb-2">Username</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
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
        <label htmlFor="password" className="block text-sm text-white/70 mb-2">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full pl-10 pr-10 py-3 rounded-lg text-white placeholder-white/40 outline-none focus:border-indigo-500"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            placeholder="Enter password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
