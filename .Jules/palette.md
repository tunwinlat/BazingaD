## 2024-03-12 - Missing ARIA Labels on Admin Actions
**Learning:** Administrative interfaces often rely heavily on compact, icon-only actions (like edit, delete, copy) which are completely inaccessible to screen reader users without proper `aria-label`s. This is a common pattern in data tables and modals.
**Action:** Ensure all icon-only buttons, especially those repeated in lists or tables, have descriptive `aria-label`s that clearly convey the action and context (e.g., 'Delete category' instead of just 'Delete').
