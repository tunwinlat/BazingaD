'use client';

import { useState, useEffect } from 'react';
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
    <header className="text-center mb-12">
      <div className="mb-8">
        <div className="text-6xl md:text-7xl font-bold text-white tracking-tight">
          {time}
        </div>
        <div className="text-lg text-white/70 mt-2">{date}</div>
      </div>
      
      <UnifiedSearch categories={categories} />
    </header>
  );
}
