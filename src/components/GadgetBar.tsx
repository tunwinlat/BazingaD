'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, X } from 'lucide-react';
import PasswordGenerator from './gadgets/PasswordGenerator';

export type GadgetType = 'password';

interface GadgetConfig {
  type: GadgetType;
  id: string;
}

interface GadgetBarProps {
  side: 'left' | 'right';
  enabled: boolean;
  config: GadgetConfig[];
}

const GADGET_REGISTRY: Record<GadgetType, { title: string; component: React.ComponentType }> = {
  password: { title: 'Password', component: PasswordGenerator },
};

const PANEL_WIDTH = 280;
const STORAGE_KEY_PREFIX = 'startpage-gadget-bar-';

export default function GadgetBar({ side, enabled, config }: GadgetBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Load persisted open state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${side}`);
      if (saved === 'open') setIsOpen(true);
    } catch { /* ignore */ }
  }, [side]);

  // Persist open state
  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${side}`, next ? 'open' : 'closed');
      } catch { /* ignore */ }
      return next;
    });
  }, [side]);

  if (!enabled || config.length === 0) return null;

  // Mobile: render nothing for now (gadgets accessible via future mobile drawer)
  if (isMobile) return null;

  const isLeft = side === 'left';

  return (
    <>
      {/* Toggle Button — vertical center of screen edge */}
      <button
        type="button"
        onClick={toggle}
        className="fixed z-40 transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          top: '50%',
          transform: `translateY(-50%) ${isOpen ? (isLeft ? `translateX(${PANEL_WIDTH}px)` : `translateX(-${PANEL_WIDTH}px)`) : 'translateX(0)'}`,
          [isLeft ? 'left' : 'right']: '0',
          marginLeft: isLeft ? '-1px' : undefined,
          marginRight: !isLeft ? '-1px' : undefined,
        }}
        aria-label={`${isOpen ? 'Close' : 'Open'} ${side} gadget bar`}
        title={`${isOpen ? 'Close' : 'Open'} gadgets`}
      >
        <div
          className="flex items-center justify-center w-6 h-14 rounded-full backdrop-blur-md transition-all duration-300"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderLeftWidth: isLeft ? '0' : '1px',
            borderRightWidth: isLeft ? '1px' : '0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
            borderTopLeftRadius: isLeft ? '0' : '9999px',
            borderBottomLeftRadius: isLeft ? '0' : '9999px',
            borderTopRightRadius: isLeft ? '9999px' : '0',
            borderBottomRightRadius: isLeft ? '9999px' : '0',
          }}
        >
          {isLeft ? (
            isOpen ? (
              <ChevronLeft className="w-3.5 h-3.5 text-white/60" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-white/60" />
            )
          ) : (
            isOpen ? (
              <ChevronRight className="w-3.5 h-3.5 text-white/60" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5 text-white/60" />
            )
          )}
        </div>
      </button>

      {/* Slide-out Panel */}
      <div
        className="fixed top-0 bottom-0 z-30 transition-transform duration-300 ease-out flex flex-col"
        style={{
          width: `${PANEL_WIDTH}px`,
          [isLeft ? 'left' : 'right']: '0',
          transform: isOpen
            ? 'translateX(0)'
            : isLeft
              ? `translateX(-${PANEL_WIDTH}px)`
              : `translateX(${PANEL_WIDTH}px)`,
          background: 'linear-gradient(180deg, rgba(15,15,30,0.85) 0%, rgba(10,10,25,0.9) 100%)',
          borderRight: isLeft ? '1px solid rgba(255,255,255,0.06)' : 'none',
          borderLeft: !isLeft ? '1px solid rgba(255,255,255,0.06)' : 'none',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: isLeft
            ? '4px 0 30px rgba(0,0,0,0.4)'
            : '-4px 0 30px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
              Gadgets
            </span>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
            style={{ color: 'var(--theme-text-muted)' }}
            aria-label="Close gadget bar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gadgets scroll area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {config.map((gadget) => {
            const registryEntry = GADGET_REGISTRY[gadget.type];
            if (!registryEntry) return null;
            const GadgetComponent = registryEntry.component;
            return (
              <GadgetCard key={gadget.id} title={registryEntry.title}>
                <GadgetComponent />
              </GadgetCard>
            );
          })}
        </div>
      </div>

      {/* Backdrop click to close (only when open) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
          onClick={toggle}
        />
      )}
    </>
  );
}

function GadgetCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <h4
        className="text-xs font-semibold uppercase tracking-wider mb-2.5"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}
