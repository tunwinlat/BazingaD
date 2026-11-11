'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import PasswordGenerator from './gadgets/PasswordGenerator';
import SportsScoreboard from './gadgets/SportsScoreboard';

export type GadgetType = 'password' | 'sports';

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
  sports: { title: 'Sports', component: SportsScoreboard },
};

const PANEL_WIDTH = 280;
const STORAGE_KEY_PREFIX = 'startpage-gadget-bar-';

export default function GadgetBar({ side, enabled, config }: GadgetBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${side}`);
      if (saved === 'open') setIsOpen(true);
    } catch { /* ignore */ }
  }, [side]);

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
          transform: `translateY(-50%) ${isOpen ? (isLeft ? `translateX(${PANEL_WIDTH + 12}px)` : `translateX(-${PANEL_WIDTH + 12}px)`) : 'translateX(0)'}`,
          [isLeft ? 'left' : 'right']: '6px',
        }}
        aria-label={`${isOpen ? 'Close' : 'Open'} ${side} gadget bar`}
        title={`${isOpen ? 'Close' : 'Open'} gadgets`}
      >
        <div
          className="flex items-center justify-center w-6 h-14 rounded-full transition-all duration-300"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderLeftWidth: isLeft ? '0' : '1px',
            borderRightWidth: isLeft ? '1px' : '0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderTopLeftRadius: isLeft ? '0' : '9999px',
            borderBottomLeftRadius: isLeft ? '0' : '9999px',
            borderTopRightRadius: isLeft ? '9999px' : '0',
            borderBottomRightRadius: isLeft ? '9999px' : '0',
          }}
        >
          {isLeft ? (
            isOpen ? (
              <ChevronLeft className="w-3.5 h-3.5 text-white/70" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-white/70" />
            )
          ) : (
            isOpen ? (
              <ChevronRight className="w-3.5 h-3.5 text-white/70" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5 text-white/70" />
            )
          )}
        </div>
      </button>

      {/* Floating Glass Panel */}
      <div
        className="fixed z-30 transition-all duration-300 ease-out"
        style={{
          width: `${PANEL_WIDTH}px`,
          top: '50%',
          [isLeft ? 'left' : 'right']: '12px',
          transform: isOpen
            ? `translateY(-50%) translateX(0)`
            : isLeft
              ? `translateY(-50%) translateX(-${PANEL_WIDTH + 40}px)`
              : `translateY(-50%) translateX(${PANEL_WIDTH + 40}px)`,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(20, 20, 40, 0.65)',
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: `
              0 25px 50px -12px rgba(0,0,0,0.6),
              0 0 0 1px rgba(255,255,255,0.04),
              inset 0 1px 0 rgba(255,255,255,0.08)
            `,
          }}
        >
          {/* Close button only — no title */}
          <div className="flex justify-end px-3 pt-2.5 pb-1">
            <button
              type="button"
              onClick={toggle}
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              aria-label="Close gadget bar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Gadgets */}
          <div
            className="px-3 pb-3 space-y-3"
            style={{
              maxHeight: 'calc(100vh - 140px)',
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarWidth: 'thin',
            }}
          >
            {config.map((gadget) => {
              const registryEntry = GADGET_REGISTRY[gadget.type];
              if (!registryEntry) return null;
              const GadgetComponent = registryEntry.component;
              return (
                <GadgetCard key={gadget.id}>
                  <GadgetComponent />
                </GadgetCard>
              );
            })}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20"
          style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
          onClick={toggle}
        />
      )}
    </>
  );
}

function GadgetCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {children}
    </div>
  );
}
