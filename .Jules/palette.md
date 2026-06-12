## 2026-03-20 - Missing Keyboard Shortcut Implementations
**Learning:** A documented keyboard shortcut (e.g., 'Esc to close') that lacks the underlying event listener creates a frustrating user experience and breaks trust.
**Action:** Always verify that 'keyboard accessible' text descriptions are actually backed up by a `useEffect` hook or event listener implementation.
## 2026-03-22 - Explicit Label Linking
**Learning:** While visual proximity implies the relationship between labels and inputs, explicitly linking them using `htmlFor` and `id` attributes is crucial for accessibility, especially for screen readers and improving the clickable area.
**Action:** Always verify that form labels are explicitly linked to their corresponding inputs using `htmlFor` and `id` attributes.
## 2026-03-23 - Search Input Clear Button
**Learning:** Users often need a quick way to clear a search query without using backspace repeatedly, especially on mobile or long queries. Keyboard navigators appreciate when the clear action restores focus smoothly to the input.
**Action:** Added an accessible clear button to the UnifiedSearch component with a properly descriptive aria-label and auto-focus.
## 2026-03-24 - Async Loading Indicators on Primary Actions
**Learning:** Users lack confidence when they submit authentication or setup forms and see no immediate visual feedback beyond the button becoming disabled. This leads to perceived sluggishness or frustration. Adding an inline loading spinner inside the primary call-to-action button directly addresses this by providing immediate validation that the system is processing their request.
**Action:** Always include inline loading indicators (like a spinner) inside the primary submit button of async forms, instead of solely relying on disabled states or global loaders.
## 2026-03-24 - Screen Reader Support for Custom Dropdowns
**Learning:** Custom dropdown components built without native `<select>` elements require explicit ARIA roles to be understood by screen readers as interactive lists. Keyboard users relying on screen readers won't know they are navigating a list without proper structure.
**Action:** When creating custom search comboboxes or dropdowns, ensure the container has `role="listbox"`, the interactive items have `role="option"` with `id`s, and the input has `role="combobox"` with `aria-activedescendant` linking to the currently focused option's `id`.
## 2024-03-24 - Admin Dashboard API Resilience and Loading Feedback
**Learning:** During UI enhancement, it became apparent that API responses for blocks and categories must be validated as arrays before setting state to prevent React crashes. Additionally, destructive actions (like deletion) need disabled states combined with loading spinners to communicate system status clearly to the user.
**Action:** Always wrap API array responses in `Array.isArray(data) ? data : []` to prevent `.map()` errors. Always use the `Loader2` spinner and a disabled state for asynchronous destructive UI actions.

## 2025-02-28 - Add Loading States to Submit Buttons
**Learning:** Async forms without immediate visual feedback on the submit button cause users to wonder if their action was registered, risking double submissions. While `disabled` state helps technically, users need a clear visual indicator like a loading spinner and updated text.
**Action:** Always include an inline loading indicator (like `Loader2` from `lucide-react`) and update the button text (e.g., from "Update" to "Updating...") inside the primary submit button of async forms.
## 2026-04-08 - DashboardHeader Logout Button UX Improvement
**Learning:** Destructive and async actions (like logout) should have immediate visual feedback to prevent multiple clicks and user confusion. Focus states are essential for accessibility, and disabled states during asynchronous operations should be clearly indicated via opacity and cursor changes.
**Action:** When implementing async buttons, always include a loading state (e.g., using lucide-react Loader2) and the standard accessibility classes (focus-visible:ring-2 focus-visible:ring-indigo-500).
## 2024-05-19 - UnifiedSearch Accessibility
**Learning:** Custom React-based search dropdowns often lack native combobox accessibility, making them invisible or confusing to screen readers. Adding explicit ARIA roles (combobox, listbox, option) and managing stateful attributes (aria-expanded, aria-activedescendant) significantly improves keyboard and screen reader navigation without altering visual design or core logic.
**Action:** When implementing or reviewing custom select/autocomplete components, ensure the W3C WAI-ARIA combobox pattern is applied to bridge the gap between visual presentation and semantic structure.
## 2026-04-11 - Password Visibility Toggle
**Learning:** Password inputs without a visibility toggle increase login friction and typos. Adding a simple toggle improves UX significantly and reduces user frustration.
**Action:** Always consider adding a show/hide password toggle to password inputs, ensuring the toggle button is accessible via keyboard and screen readers.
## 2026-05-04 - Password Visibility Toggle Padding
**Learning:** When adding absolute positioned icons inside form inputs (e.g., for password visibility toggles), failing to adjust the input's padding causes typed text to overlap visually with the icon.
**Action:** Always ensure the corresponding input element's padding is appropriately adjusted (e.g., changing `pr-4` to `pr-12` or `pr-10` in Tailwind depending on icon width and positioning) to maintain input text readability.
## 2026-05-20 - API Key Visibility Toggle Consistency
**Learning:** Using standard `Eye`/`EyeOff` icons for API key visibility toggles (rather than text like "Show"/"Hide") maintains consistency with password inputs, saves horizontal space on mobile, and creates a more cohesive UI language. It requires converting to a relative wrapper and setting correct right-padding to prevent overlap.
**Action:** Replace generic "Show/Hide" text buttons with accessible `Eye`/`EyeOff` icon buttons using absolute positioning and `aria-label` attributes on inputs containing sensitive tokens or keys.
## 2026-05-20 - Icon-only Buttons Missing ARIA Labels
**Learning:** Icon-only buttons (like "Back" or "Close" buttons) in news components lacked `aria-label` attributes, making them inaccessible to screen reader users who wouldn't know their function.
**Action:** Always add descriptive `aria-label` attributes to icon-only buttons to ensure they are accessible to assistive technologies.
## 2026-06-25 - Admin Dashboard Logout Button UX Improvement
**Learning:** Destructive and async actions like logging out from the admin dashboard should always provide immediate visual feedback. Without it, users may click multiple times or think the application is frozen. Additionally, lack of focus states makes it difficult for keyboard users to navigate.
**Action:** When implementing async buttons like Logout, always include a loading state using a spinner (e.g., `Loader2` from `lucide-react`), update the button text, and ensure proper accessibility classes (`focus-visible:ring-2`, `focus-visible:ring-red-500`, and `disabled:opacity-50`) are added.
## 2026-06-01 - Screen Reader Support for Custom Modals
**Learning:** Custom modal components built with absolute/fixed positioning lack inherent semantic meaning to screen readers unless specifically marked. Without ARIA roles and labels, users relying on assistive technologies may not realize a dialog has opened or what its context is.
**Action:** When creating custom modal or dialog overlays, always ensure the container element includes `role="dialog"`, `aria-modal="true"`, and an `aria-labelledby` attribute pointing to the ID of the modal's heading.
## 2026-06-25 - Async Loading Indicators for Secondary Admin Actions
**Learning:** We previously identified the need for loading feedback on primary async forms and destructive operations. Secondary admin actions like updating settings, changing passwords, or configuring 2FA lack this feedback, causing inconsistent UX where users wait without knowing if an API call is running.
**Action:** Extend the pattern of adding `Loader2` spinners and disabled state handling (`disabled:opacity-50`, `focus-visible` styling) to all asynchronous admin action buttons for a unified, confident user experience.
## 2024-05-24 - Dynamic ARIA Labels on Content-Rich Buttons
**Learning:** Adding a static `aria-label` to a button that contains dynamic content (like a news headline) completely overrides the visible text for screen reader users. This creates a severe accessibility regression where users hear "Read full news article" but not *which* article they are selecting.
**Action:** Always dynamically interpolate the content into the `aria-label` (e.g., ``aria-label={`Read news article: ${displayTitle}`}``) or use `aria-describedby` when supplementing context on buttons wrapping dynamic text.
