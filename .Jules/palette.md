## 2026-03-20 - Missing Keyboard Shortcut Implementations
**Learning:** A documented keyboard shortcut (e.g., 'Esc to close') that lacks the underlying event listener creates a frustrating user experience and breaks trust.
**Action:** Always verify that 'keyboard accessible' text descriptions are actually backed up by a `useEffect` hook or event listener implementation.
