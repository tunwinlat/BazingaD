'use client';

import { useState, useCallback } from 'react';
import { RefreshCw, Copy, Check, Key, Type } from 'lucide-react';
import { generateRandomPassword, generateWordPassword } from '@/lib/wordlist';

type PasswordMode = 'random' | 'words';

export default function PasswordGenerator() {
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<PasswordMode>('words');
  const [copied, setCopied] = useState(false);
  const [justGenerated, setJustGenerated] = useState(false);

  const generate = useCallback(() => {
    const newPass = mode === 'random' ? generateRandomPassword() : generateWordPassword();
    setPassword(newPass);
    setJustGenerated(true);
    setCopied(false);

    // Auto-copy to clipboard
    navigator.clipboard.writeText(newPass).catch(() => {
      // Silent fail — user can manual copy
    });

    // Flash effect
    setTimeout(() => setJustGenerated(false), 300);
  }, [mode]);

  const handleCopy = useCallback(() => {
    if (!password) return;
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [password]);

  return (
    <div className="flex flex-col gap-3">
      {/* Mode toggle */}
      <div className="flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <button
          type="button"
          onClick={() => { setMode('words'); setPassword(''); }}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all"
          style={{
            backgroundColor: mode === 'words' ? 'rgba(99,102,241,0.25)' : 'transparent',
            color: mode === 'words' ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
          }}
        >
          <Type className="w-3 h-3" />
          Words
        </button>
        <button
          type="button"
          onClick={() => { setMode('random'); setPassword(''); }}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all"
          style={{
            backgroundColor: mode === 'random' ? 'rgba(99,102,241,0.25)' : 'transparent',
            color: mode === 'random' ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
          }}
        >
          <Key className="w-3 h-3" />
          Random
        </button>
      </div>

      {/* Password display */}
      <div
        className="relative rounded-xl px-3 py-2.5 min-h-[44px] flex items-center justify-center text-center transition-all"
        style={{
          backgroundColor: justGenerated ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          wordBreak: 'break-all',
        }}
      >
        {password ? (
          <span
            className="text-sm font-mono tracking-wide"
            style={{ color: 'var(--theme-text)' }}
          >
            {password}
          </span>
        ) : (
          <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            Click generate...
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={generate}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: 'rgba(99,102,241,0.2)',
            color: '#a5b4fc',
            border: '1px solid rgba(99,102,241,0.3)',
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Generate
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!password}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            backgroundColor: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
            color: copied ? '#34d399' : 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
