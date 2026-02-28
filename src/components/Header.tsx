'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export default function Header() {
  const [time, setTime] = useState('--:--');
  const [date, setDate] = useState('Loading...');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Keyboard shortcut: '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="text-center mb-12">
      <div className="mb-8">
        <div className="text-6xl md:text-7xl font-bold text-white tracking-tight">
          {time}
        </div>
        <div className="text-lg text-white/70 mt-2">{date}</div>
      </div>
      
      <div className="max-w-xl mx-auto">
        <form action="https://www.google.com/search" method="GET" className="relative">
          <div 
            className="flex items-center rounded-full px-4 py-2 transition-all duration-300"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isFocused ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: isFocused ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : 'none',
            }}
          >
            <Search className="w-5 h-5 text-white/50 ml-2" />
            <input
              ref={inputRef}
              type="text"
              name="q"
              placeholder="Search Google..."
              autoComplete="off"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 px-3 py-2 text-base"
              style={{ 
                outline: 'none',
                boxShadow: 'none',
              }}
            />
            <kbd 
              className="hidden sm:block px-2 py-1 rounded text-xs text-white/40"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              /
            </kbd>
          </div>
        </form>
      </div>
    </header>
  );
}
