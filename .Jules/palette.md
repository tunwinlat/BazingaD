## 2026-03-20 - Missing Keyboard Shortcut Implementations
**Learning:** A documented keyboard shortcut (e.g., 'Esc to close') that lacks the underlying event listener creates a frustrating user experience and breaks trust.
**Action:** Always verify that 'keyboard accessible' text descriptions are actually backed up by a `useEffect` hook or event listener implementation.
## 2026-03-22 - Explicit Label Linking
**Learning:** While visual proximity implies the relationship between labels and inputs, explicitly linking them using `htmlFor` and `id` attributes is crucial for accessibility, especially for screen readers and improving the clickable area.
**Action:** Always verify that form labels are explicitly linked to their corresponding inputs using `htmlFor` and `id` attributes.
