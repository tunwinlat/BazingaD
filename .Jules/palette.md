## 2024-03-12 - Missing ARIA Labels on Admin Actions
**Learning:** Administrative interfaces often rely heavily on compact, icon-only actions (like edit, delete, copy) which are completely inaccessible to screen reader users without proper `aria-label`s. This is a common pattern in data tables and modals.
**Action:** Ensure all icon-only buttons, especially those repeated in lists or tables, have descriptive `aria-label`s that clearly convey the action and context (e.g., 'Delete category' instead of just 'Delete').

## 2024-03-24 - Missing Focus State on Custom Interactive Cards
**Learning:** Custom interactive components (like Block cards with complex custom borders and `overflow-hidden`) often mask default browser focus rings. Without explicit `focus-visible` styling, these primary interactive elements are completely invisible to keyboard users navigating via Tab.
**Action:** Always add explicit `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500` (or appropriate theme color) to custom card-based links/buttons to ensure keyboard navigation remains accessible.
