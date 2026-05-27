'use client';

import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, Rocket } from 'lucide-react';
import { subscribe, getSnapshot, type TransitionState } from '@/lib/navTransition';
import { getDomain, getBlockIcon } from '@/lib/utils';

function LaunchOverlay({ state }: { state: TransitionState }) {
  const domain = state.url ? getDomain(state.url) : '';
  const iconUrl = state.icon || (state.url ? getBlockIcon({ url: state.url, icon: state.icon }) : null);
  const initials = state.title
    ? state.title
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '→';

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        backgroundColor: 'rgba(10, 10, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        animation: 'fadeIn 0.25s ease-out forwards',
      }}
    >
      {/* Pulsing ring */}
      <div
        className="absolute w-48 h-48 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          animation: 'pulseGlow 2s ease-in-out infinite',
        }}
      />

      {/* Icon */}
      <div className="relative mb-6">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl"
          style={{
            backgroundColor: 'var(--theme-surface)',
            border: '1px solid var(--theme-surface-border)',
            animation: 'scaleIn 0.3s ease-out forwards',
          }}
        >
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} alt="" className="w-10 h-10 object-contain" />
          ) : (
            <Rocket className="w-10 h-10 text-indigo-400" />
          )}
        </div>
      </div>

      {/* Title */}
      {state.title && (
        <h2
          className="text-xl font-semibold mb-1"
          style={{
            color: 'var(--theme-text)',
            animation: 'slideUpFade 0.3s ease-out 0.05s both',
          }}
        >
          {state.title}
        </h2>
      )}

      {/* Domain */}
      <div
        className="flex items-center gap-1.5 text-sm mb-6"
        style={{
          color: 'var(--theme-text-muted)',
          animation: 'slideUpFade 0.3s ease-out 0.1s both',
        }}
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>{domain || state.url}</span>
      </div>

      {/* Spinner */}
      <div
        className="flex items-center gap-2 text-sm"
        style={{
          color: 'var(--theme-text-muted)',
          animation: 'slideUpFade 0.3s ease-out 0.15s both',
        }}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Opening...</span>
      </div>
    </div>
  );
}

function ExitAnimation({ state }: { state: TransitionState }) {
  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none"
      style={{
        backgroundColor: 'rgba(10, 10, 20, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.3s ease-out forwards',
      }}
    >
      {/* Center message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex flex-col items-center"
          style={{ animation: 'slideUpFade 0.25s ease-out 0.1s both' }}
        >
          <ExternalLink className="w-8 h-8 text-indigo-400 mb-3" />
          <span className="text-lg font-medium" style={{ color: 'var(--theme-text)' }}>
            {state.title || 'Opening link...'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function NavTransition() {
  const [state, setState] = useState<TransitionState>(getSnapshot);

  useEffect(() => {
    return subscribe(setState);
  }, []);

  if (!state.active) return null;

  return state.type === 'overlay' ? (
    <LaunchOverlay state={state} />
  ) : (
    <ExitAnimation state={state} />
  );
}
