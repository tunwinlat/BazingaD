## 2024-05-14 - ARIA labels for icon-only buttons
**Learning:** The KeyboardShortcutsModal uses a generic close button icon (`<X>`) with no accessible name. This is a common pattern in generic UI components that are often overlooked for screen reader accessibility.
**Action:** Always scan for generic icon-only buttons (like `X`, `Trash`, `Edit`) and ensure they are given specific `aria-label` attributes to inform users of the action they trigger.
