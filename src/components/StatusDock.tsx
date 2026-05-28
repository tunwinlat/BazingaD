'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronDown,
  Pin,
  PinOff,
  Clock,
  Car,
  Navigation,
  LayoutGrid,
  Grid2X2,
  LayoutTemplate,
  List,
  LogOut,
  Loader2,
  Newspaper,
} from 'lucide-react';
import Weather from './Weather';
import TrafficDisplay from './TrafficDisplay';
import NewsTicker from './NewsTicker';
import type { ViewMode } from '@/types';

interface TrafficSettings {
  enabled: boolean;
  homeAddress: string;
  workAddress: string;
}

interface StatusDockProps {
  isAdmin?: boolean;
  isProtected?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  trafficSettings: TrafficSettings | null;
  onNewsClick?: () => void;
}

const PIN_STORAGE_KEY = 'startpage-status-dock-pinned';

const viewOptions: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
  { value: 'comfortable', label: 'Comfortable', icon: <LayoutGrid className="w-4 h-4" /> },
  { value: 'compact', label: 'Compact', icon: <Grid2X2 className="w-4 h-4" /> },
  { value: 'dense', label: 'Dense', icon: <LayoutTemplate className="w-4 h-4" /> },
  { value: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
];

export default function StatusDock({
  isAdmin,
  isProtected,
  viewMode,
  onViewModeChange,
  trafficSettings,
  onNewsClick,
}: StatusDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(() => {
    try {
      return localStorage.getItem(PIN_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [time, setTime] = useState('--:--');
  const [date, setDate] = useState('');
  const dockRef = useRef<HTMLDivElement>(null);

  // Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
      setDate(
        now.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to collapse
  useEffect(() => {
    if (isPinned) return;
    const handler = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isPinned]);

  // Escape to collapse
  useEffect(() => {
    if (isPinned) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPinned]);

  const togglePin = useCallback(() => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PIN_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const toggleExpand = useCallback(() => {
    if (isPinned) return;
    setIsExpanded((prev) => !prev);
  }, [isPinned]);

  const showPanel = isPinned || isExpanded;

  return (
    <div ref={dockRef} className="w-full">
      {/* Collapsed Status Pill */}
      {!showPanel && (
        <button
          type="button"
          onClick={toggleExpand}
          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/[0.07] active:scale-[0.99]"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
          }}
          aria-expanded="false"
          aria-label="Show status panel"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Time */}
            <span className="text-base font-bold tracking-tight text-white/90">{time}</span>

            {/* Divider */}
            <div
              className="w-px h-4 self-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
            />

            {/* Weather glance */}
            <Weather minimal />

            {/* Divider */}
            <div
              className="w-px h-4 self-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
            />

            {/* Traffic dot */}
            <div className="flex items-center gap-1.5">
              <TrafficDisplay settings={trafficSettings} minimal />
              <Car className="w-3.5 h-3.5 text-white/30" />
            </div>

            {/* News indicator */}
            {onNewsClick && (
              <>
                <div
                  className="w-px h-4 self-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
                />
                <div className="flex-1 min-w-0">
                  <NewsTicker onClick={onNewsClick} compact />
                </div>
              </>
            )}
          </div>

          {/* Expand chevron */}
          <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />
        </button>
      )}

      {/* Expanded Status Panel */}
      {showPanel && (
        <div
          className="animate-slideDown rounded-2xl overflow-hidden"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
          role="dialog"
          aria-label="Status panel"
        >
          {/* Panel Header with Pin */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <span className="text-xs font-medium uppercase tracking-wider text-white/40">
              Status
            </span>
            <div className="flex items-center gap-1">
              {!isPinned && (
                <button
                  type="button"
                  onClick={toggleExpand}
                  className="p-1.5 rounded-md transition-colors hover:bg-white/10 text-white/40 hover:text-white/70"
                  aria-label="Collapse status panel"
                  title="Collapse"
                >
                  <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                </button>
              )}
              <button
                type="button"
                onClick={togglePin}
                className="p-1.5 rounded-md transition-colors hover:bg-white/10"
                style={{ color: isPinned ? '#a5b4fc' : 'rgba(255,255,255,0.4)' }}
                aria-label={isPinned ? 'Unpin status panel' : 'Pin status panel'}
                title={isPinned ? 'Unpin panel' : 'Pin panel'}
              >
                {isPinned ? (
                  <Pin className="w-3.5 h-3.5" />
                ) : (
                  <PinOff className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="p-4 space-y-3">
            {/* Time Card */}
            <TimeCard time={time} date={date} />

            {/* Weather Card */}
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Weather compact />
            </div>

            {/* Traffic Card */}
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="w-4 h-4 text-white/40" />
                <span className="text-xs font-medium uppercase tracking-wider text-white/40">
                  Commute
                </span>
              </div>
              <TrafficDisplay settings={trafficSettings} />
            </div>

            {/* News Card */}
            {onNewsClick && (
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Newspaper className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                  <span className="text-xs font-medium uppercase tracking-wider text-white/40">
                    News
                  </span>
                </div>
                <NewsTicker onClick={onNewsClick} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons Row — always visible below the dock */}
      <ActionButtons
        isAdmin={isAdmin}
        isProtected={isProtected}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />
    </div>
  );
}

// ------------------------------------------------------------------
// Time Card
// ------------------------------------------------------------------
function TimeCard({ time, date }: { time: string; date: string }) {
  const [hours] = time.split(':');
  const isNight = parseInt(hours, 10) >= 19 || parseInt(hours, 10) < 6;

  return (
    <div
      className="relative rounded-xl p-4 overflow-hidden"
      style={{
        background: isNight
          ? 'linear-gradient(135deg, rgba(30, 27, 75, 0.5) 0%, rgba(15, 23, 42, 0.4) 100%)'
          : 'linear-gradient(135deg, rgba(49, 46, 129, 0.3) 0%, rgba(15, 23, 42, 0.3) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Subtle glow accent */}
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-30 blur-2xl"
        style={{ backgroundColor: isNight ? '#4f46e5' : '#f59e0b' }}
      />

      <div className="relative flex items-center gap-4">
        <Clock className="w-5 h-5 text-white/40 flex-shrink-0" />
        <div>
          <div
            className="text-3xl font-bold tracking-tight text-white"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {time}
          </div>
          <div className="text-sm text-white/50 mt-0.5">{date}</div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Action Buttons
// ------------------------------------------------------------------
function ActionButtons({
  isAdmin,
  isProtected,
  viewMode,
  onViewModeChange,
}: {
  isAdmin?: boolean;
  isProtected?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/dashboard', { method: 'DELETE' });
      router.push('/dashboard-login');
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3 justify-end">
      {/* View mode selector */}
      {onViewModeChange && (
        <div
          className="flex items-center gap-0.5 p-1 rounded-lg"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          role="group"
          aria-label="View mode"
        >
          {viewOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onViewModeChange(option.value)}
              title={option.label}
              aria-label={option.label}
              aria-pressed={viewMode === option.value}
              className="p-1.5 rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              style={{
                backgroundColor:
                  viewMode === option.value ? 'rgba(99,102,241,0.25)' : 'transparent',
                color: viewMode === option.value ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
              }}
            >
              {option.icon}
            </button>
          ))}
        </div>
      )}

      {/* Admin */}
      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">Admin</span>
        </Link>
      )}

      {/* Protected */}
      {!isAdmin && isProtected && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="hidden sm:inline">Protected</span>
        </div>
      )}

      {/* Logout */}
      {isProtected && (
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {isLoggingOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </span>
        </button>
      )}
    </div>
  );
}
