'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut, Loader2, LayoutGrid, Grid2X2, LayoutTemplate, List, Check,
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

export default function TopBar({ isAdmin, isProtected, viewMode = 'comfortable', onViewModeChange }: TopBarProps) {
  const router = useRouter();
  const [time, setTime] = useState('--:--');
  const [date, setDate] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [trafficSettings, setTrafficSettings] = useState<TrafficSettings | null>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);

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
    const fetchTraffic = async () => {
      try {
        const response = await fetch('/api/settings/traffic');
        if (response.ok) {
          const data = await response.json();
          setTrafficSettings({
            enabled: data.enabled,
            homeAddress: data.homeAddress,
            workAddress: data.workAddress,
          });
        }
      } catch (error) {
        console.error('Failed to fetch traffic settings:', error);
      }
    };
    fetchTraffic();
  }, []);

  // Close view menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setShowViewMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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

  const currentViewLabel = viewOptions.find(v => v.value === viewMode)?.label || 'Comfortable';

  return (
    <div
      className="rounded-2xl p-3 md:p-4 mb-6 flex flex-wrap items-center gap-3 md:gap-4"
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
      <div className="flex items-center gap-2 ml-auto">
        {/* View mode toggle */}
        {onViewModeChange && (
          <div className="relative" ref={viewMenuRef}>
            <button
              onClick={() => setShowViewMenu(!showViewMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              title="Change view"
              aria-label="Change view mode"
              aria-expanded={showViewMenu}
            >
              {viewOptions.find(v => v.value === viewMode)?.icon}
              <span className="hidden sm:inline">{currentViewLabel}</span>
            </button>

            {showViewMenu && (
              <div
                className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50 min-w-[160px]"
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                {viewOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onViewModeChange(option.value);
                      setShowViewMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5 text-left"
                    style={{
                      color: viewMode === option.value ? '#818cf8' : 'rgba(255,255,255,0.8)',
                      backgroundColor: viewMode === option.value ? 'rgba(99,102,241,0.1)' : undefined,
                    }}
                  >
                    {option.icon}
                    <span className="flex-1">{option.label}</span>
                    {viewMode === option.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
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
