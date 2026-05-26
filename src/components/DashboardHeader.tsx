'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Loader2, LayoutGrid, Grid2X2, LayoutTemplate, List, Check } from 'lucide-react';
import type { ViewMode } from '@/types';

interface DashboardHeaderProps {
  isAdmin?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

const viewOptions: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
  { value: 'comfortable', label: 'Comfortable', icon: <LayoutGrid className="w-4 h-4" /> },
  { value: 'compact', label: 'Compact', icon: <Grid2X2 className="w-4 h-4" /> },
  { value: 'dense', label: 'Dense', icon: <LayoutTemplate className="w-4 h-4" /> },
  { value: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
];

function DashboardHeader({ isAdmin, viewMode = 'comfortable', onViewModeChange }: DashboardHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

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

  // Close view menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
        setShowViewMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentViewLabel = viewOptions.find(v => v.value === viewMode)?.label || 'Comfortable';

  return (
    <div className="flex justify-end items-center gap-2 mb-4 flex-wrap">
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
          Admin
        </Link>
      )}

      {/* Protected badge (non-admin) */}
      {!isAdmin && (
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
          Protected
        </div>
      )}

      {/* Logout button */}
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
    </div>
  );
}

export default memo(DashboardHeader);
