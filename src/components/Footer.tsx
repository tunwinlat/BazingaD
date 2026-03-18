'use client';

import { useState } from 'react';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';

export default function Footer() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <>
      <footer className="text-center py-6 mt-8">
        <button
          onClick={() => setShowShortcuts(true)}
          className="text-white/50 text-sm hover:text-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-2 py-1"
          aria-label="View keyboard shortcuts"
        >
          Keyboard shortcuts
        </button>
      </footer>

      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </>
  );
}
