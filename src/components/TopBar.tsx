'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut, Loader2, LayoutGrid, Grid2X2, LayoutTemplate, List,
} from 'lucide-react';
import Weather from './Weather';
import TrafficDisplay from './TrafficDisplay';
import StatusDock from './StatusDock';
import NewsTicker from './NewsTicker';
import type { ViewMode } from '@/types';

function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
    </span>
  );
}

interface TopBarProps {
  isAdmin?: boolean;
  isProtected?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onNewsClick?: () => void;
}

interface TrafficSettings {
  enabled: boolean;
  homeAddress: string;
  workAddress: string;
}

const viewOptions: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
  { value: 'comfortable', label: 'Comfortable', icon: <LayoutGrid className="w-4 h-4" /> },
  { value: 'compact', label: 'Compact', icon: <Grid2X2 className="w-4 h-4" /> },
  { value: 'dense', label: 'Dense', icon: <LayoutTemplate className="w-4 h-4" /> },
  { value: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
];

function TopBar({ isAdmin, isProtected, viewMode = 'comfortable', onViewModeChange, onNewsClick }: TopBarProps) {
  const router = useRouter();
  const [time, setTime] = useState('--:--');
  const [date, setDate] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [trafficSettings, setTrafficSettings] = useState<TrafficSettings | null>(null);

  // Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setDate(now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch traffic settings
  useEffect(() => {
    const controller = new AbortController();

    const fetchTraffic = async () => {
      try {
        const response = await fetch('/api/settings/traffic', { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          setTrafficSettings({
            enabled: data.enabled,
            homeAddress: data.homeAddress,
            workAddress: data.workAddress,
          });
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch traffic settings:', error);
        }
      }
    };
    fetchTraffic();

    return () => controller.abort();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/dashboard', { method: 'DELETE' });
      router.push('/dashboard-login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* ─── Desktop Layout (≥ md) ─── */}
      <div
        className="hidden md:flex flex-col gap-3 rounded-2xl p-4 mb-6"
        style={{
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Top Row: Time | Status Island | Actions */}
        <div className="flex items-center gap-4">
          {/* ── Time & Date ── */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <div className="relative">
              <div
                className="text-3xl font-bold tracking-tight leading-none"
                style={{ color: 'var(--theme-text)', fontVariantNumeric: 'tabular-nums' }}
              >
                {time}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <LiveDot />
                <span className="text-[11px] leading-tight" style={{ color: 'var(--theme-text-muted)' }}>
                  {date}
                </span>
              </div>
            </div>
          </div>

          {/* ── Status Island: Weather + Traffic ── */}
          <div className="flex-1 flex justify-center min-w-0">
            <div
              className="flex items-center gap-4 sm:gap-5 px-5 py-2.5 rounded-2xl transition-colors hover:bg-white/[0.04]"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              <div className="min-w-0">
                <Weather compact />
              </div>

              {trafficSettings?.enabled && (
                <>
                  <div
                    className="hidden sm:block w-px h-8 flex-shrink-0"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                  />
                  <div className="hidden sm:block flex-shrink-0">
                    <TrafficDisplay settings={trafficSettings} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Right-side Actions ── */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {/* View mode selector */}
            {onViewModeChange && (
              <div
                className="flex items-center gap-0.5 p-1 rounded-xl"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
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
                    className="p-1.5 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    style={{
                      backgroundColor: viewMode === option.value ? 'rgba(99,102,241,0.2)' : 'transparent',
                      color: viewMode === option.value ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {option.icon}
                  </button>
                ))}
              </div>
            )}

            {/* Admin button */}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                <LiveDot />
                <span className="hidden lg:inline">Admin</span>
              </Link>
            )}

            {/* Protected badge */}
            {!isAdmin && isProtected && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.18)',
                }}
              >
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                <span className="hidden lg:inline">Protected</span>
              </div>
            )}

            {/* Logout */}
            {isProtected && (
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all hover:bg-white/[0.08] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                {isLoggingOut ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                <span className="hidden lg:inline">{isLoggingOut ? '...' : 'Logout'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ── News Ticker Strip ── */}
        {onNewsClick && (
          <div
            className="flex items-center gap-2 pt-2.5"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <NewsTicker onClick={onNewsClick} />
          </div>
        )}
      </div>

      {/* ─── Mobile Layout (< md) ─── */}
      <div className="md:hidden mb-6">
        <StatusDock
          isAdmin={isAdmin}
          isProtected={isProtected}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          trafficSettings={trafficSettings}
          onNewsClick={onNewsClick}
        />
      </div>
    </>
  );
}

export default memo(TopBar);
