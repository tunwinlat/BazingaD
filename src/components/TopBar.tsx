'use client';

import { memo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut, Loader2, LayoutGrid, Grid2X2, LayoutTemplate, List,
} from 'lucide-react';
import Weather from './Weather';
import TrafficDisplay from './TrafficDisplay';
import type { ViewMode } from '@/types';

interface TopBarProps {
  isAdmin?: boolean;
  isProtected?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
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

function TopBar({ isAdmin, isProtected, viewMode = 'comfortable', onViewModeChange }: TopBarProps) {
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
    <div
      className="rounded-2xl p-3 md:p-4 mb-6 flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Time & Date */}
      <div className="flex-shrink-0 min-w-[120px]">
        <div className="text-2xl md:text-3xl font-bold tracking-tight leading-none" style={{ color: 'var(--theme-text)' }}>
          {time}
        </div>
        <div className="text-[11px] mt-1 leading-tight" style={{ color: 'var(--theme-text-muted)' }}>
          {date}
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px h-10 self-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />

      {/* Weather — constrained width */}
      <div className="flex-1 min-w-0 max-w-[280px] lg:max-w-[320px]">
        <Weather compact />
      </div>

      {/* Divider */}
      <div className="hidden lg:block w-px h-10 self-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />

      {/* Traffic */}
      <div className="flex-shrink-0">
        <TrafficDisplay settings={trafficSettings} />
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto justify-end">
        {/* View mode selector — segmented icon buttons */}
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
                  backgroundColor: viewMode === option.value ? 'rgba(99,102,241,0.25)' : 'transparent',
                  color: viewMode === option.value ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
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

        {/* Protected badge (non-admin) */}
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
            <span className="hidden sm:inline">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(TopBar);
