'use client';

import { useState, useEffect } from 'react';
import { X, Search, Command, ArrowUp, ArrowDown, CornerDownLeft, Lock } from 'lucide-react';

export default function Footer() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Listen for '?' key to show shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts on '?' key (but not when typing in inputs)
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setShowShortcuts(true);
      }
      // Close on Escape
      if (e.key === 'Escape') {
        setShowShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <footer className="text-center py-6 mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-white/50 text-sm">
          <p className="flex items-center gap-1">
            <Search className="w-3.5 h-3.5" />
            <kbd className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-xs">Ctrl</kbd>
            <span>+</span>
            <kbd className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-xs">K</kbd>
            <span className="ml-1">to search blocks</span>
          </p>
          <span className="hidden sm:inline text-white/20">|</span>
          <button
            onClick={() => setShowShortcuts(true)}
            className="flex items-center gap-1 hover:text-white/70 transition-colors"
          >
            <Command className="w-3.5 h-3.5" />
            <kbd className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-xs">?</kbd>
            <span className="ml-1">for all shortcuts</span>
          </button>
        </div>
      </footer>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowShortcuts(false)}
          />
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              backgroundColor: 'rgba(30, 30, 50, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Search Section */}
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">
                  Search
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Open block search</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 rounded bg-white/10 text-xs">Ctrl</kbd>
                      <span className="text-white/40">+</span>
                      <kbd className="px-2 py-1 rounded bg-white/10 text-xs">K</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Close search</span>
                    <kbd className="px-2 py-1 rounded bg-white/10 text-xs">Esc</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Navigate results</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-1 rounded bg-white/10 text-xs">
                        <ArrowUp className="w-3 h-3 inline" />
                      </kbd>
                      <kbd className="px-1.5 py-1 rounded bg-white/10 text-xs">
                        <ArrowDown className="w-3 h-3 inline" />
                      </kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Open selected</span>
                    <kbd className="px-2 py-1 rounded bg-white/10 text-xs">
                      <CornerDownLeft className="w-3 h-3 inline" />
                    </kbd>
                  </div>
                </div>
              </div>

              {/* General Section */}
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">
                  General
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Show keyboard shortcuts</span>
                    <kbd className="px-2 py-1 rounded bg-white/10 text-xs">?</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Focus Google search</span>
                    <kbd className="px-2 py-1 rounded bg-white/10 text-xs">/</kbd>
                  </div>
                </div>
              </div>

              {/* Admin Section */}
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">
                  Admin
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Open admin panel</span>
                    <span className="text-sm text-white/40">Click settings icon</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-black/20 text-xs text-white/40 text-center">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10">Esc</kbd> to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}
