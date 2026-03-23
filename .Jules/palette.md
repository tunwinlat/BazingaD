## 2026-03-20 - Missing Keyboard Shortcut Implementations
**Learning:** A documented keyboard shortcut (e.g., 'Esc to close') that lacks the underlying event listener creates a frustrating user experience and breaks trust.
**Action:** Always verify that 'keyboard accessible' text descriptions are actually backed up by a `useEffect` hook or event listener implementation.
## 2026-03-22 - Explicit Label Linking
**Learning:** While visual proximity implies the relationship between labels and inputs, explicitly linking them using `htmlFor` and `id` attributes is crucial for accessibility, especially for screen readers and improving the clickable area.
**Action:** Always verify that form labels are explicitly linked to their corresponding inputs using `htmlFor` and `id` attributes.
## 2026-03-23 - Search Input Clear Button
**Learning:** Users often need a quick way to clear a search query without using backspace repeatedly, especially on mobile or long queries. Keyboard navigators appreciate when the clear action restores focus smoothly to the input.
**Action:** Added an accessible clear button to the UnifiedSearch component with a properly descriptive aria-label and auto-focus.
