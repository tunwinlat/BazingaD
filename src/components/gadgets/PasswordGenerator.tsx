'use client';

import { useState, useCallback } from 'react';
import { RefreshCw, Copy, Check, Key, Type } from 'lucide-react';
import { generateRandomPassword, generateWordPassword } from '@/lib/wordlist';

type PasswordMode = 'random' | 'words';

export default function PasswordGenerator() {
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<PasswordMode>('words');
  const [copied, setCopied] = useState(false);
  const [flash, setFlash] = useState(false);

  const generate = useCallback(() => {
    const newPass = mode === 'random' ? generateRandomPassword() : generateWordPassword();
    setPassword(newPass);
    setFlash(true);
    setCopied(false);

    navigator.clipboard.writeText(newPass).catch(() => {});
    setTimeout(() => setFlash(false), 250);
  }, [mode]);

  const handleCopy = useCallback(() => {
    if (!password) return;
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [password]);

  return (
    <div className="flex flex-col gap-2.5">
      {/* Mode toggle */}
      <div
        className="flex gap-0.5 p-0.5 rounded-lg"
        style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
      >
        <button
          type="button"
          onClick={() => { setMode('words'); setPassword(''); }}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all"
          style={{
            backgroundColor: mode === 'words' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: mode === 'words' ? '#fff' : 'rgba(255,255,255,0.45)',
            textShadow: mode === 'words' ? '0 1px 2px rgba(0,0,0,0.4)' : 'none',
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
            backgroundColor: mode === 'random' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: mode === 'random' ? '#fff' : 'rgba(255,255,255,0.45)',
            textShadow: mode === 'random' ? '0 1px 2px rgba(0,0,0,0.4)' : 'none',
          }}
        >
          <Key className="w-3 h-3" />
          Random
        </button>
      </div>

      {/* Password display — glass card with strong text */}
      <div
        className="relative rounded-xl px-3 py-3 min-h-[48px] flex items-center justify-center text-center transition-all duration-200"
        style={{
          backgroundColor: flash ? 'rgba(99,102,241,0.2)' : 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.2)',
          wordBreak: 'break-all',
        }}
      >
        {password ? (
          <span
            className="text-sm font-mono tracking-wide"
            style={{
              color: '#fff',
              textShadow: '0 1px 3px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.3)',
            }}
          >
            {password}
          </span>
        ) : (
          <span
            className="text-xs"
            style={{
              color: 'rgba(255,255,255,0.35)',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}
          >
            Click generate…
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
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
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
            background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
            color: copied ? '#6ee7b7' : 'rgba(255,255,255,0.7)',
            border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            textShadow: copied ? '0 1px 2px rgba(0,0,0,0.4)' : 'none',
          }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
