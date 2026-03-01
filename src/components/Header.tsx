'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import UnifiedSearch from './UnifiedSearch';
import type { Category } from '@/types';

interface HeaderProps {
  categories: Category[];
}

export default function Header({ categories }: HeaderProps) {
  const [time, setTime] = useState('--:--');
  const [date, setDate] = useState('Loading...');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);
      setDate(now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="text-center mb-12 relative">
      {/* Admin Settings Icon */}
      <div className="absolute top-0 right-0">
        <Link
          href="/admin"
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-white/10"
          style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-surface-border)' }}
          title="Admin Settings"
        >
          <Settings className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
          <span className="text-sm hidden sm:inline" style={{ color: 'var(--theme-text-muted)' }}>Admin</span>
        </Link>
      </div>

      <div className="mb-8">
        <div className="text-6xl md:text-7xl font-bold tracking-tight" style={{ color: 'var(--theme-text)' }}>
          {time}
        </div>
        <div className="text-lg mt-2" style={{ color: 'var(--theme-text-muted)' }}>{date}</div>
      </div>
      
      <UnifiedSearch categories={categories} />
    </header>
  );
}
