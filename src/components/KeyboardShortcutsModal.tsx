'use client';

import { useEffect } from 'react';
import { X, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
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
          <h2 id="keyboard-shortcuts-title" className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
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
                <span>Focus search</span>
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
                <span className="text-sm text-white/40">Click Admin button (top right)</span>
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
  );
}
