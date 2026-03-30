## 2026-03-24 - Async Loading Indicators on Primary Actions
**Learning:** Users lack confidence when they submit authentication or setup forms and see no immediate visual feedback beyond the button becoming disabled. This leads to perceived sluggishness or frustration. Adding an inline loading spinner inside the primary call-to-action button directly addresses this by providing immediate validation that the system is processing their request.
**Action:** Always include inline loading indicators (like a spinner) inside the primary submit button of async forms, instead of solely relying on disabled states or global loaders.
## 2026-03-24 - Screen Reader Support for Custom Dropdowns
**Learning:** Custom dropdown components built without native `<select>` elements require explicit ARIA roles to be understood by screen readers as interactive lists. Keyboard users relying on screen readers won't know they are navigating a list without proper structure.
**Action:** When creating custom search comboboxes or dropdowns, ensure the container has `role="listbox"`, the interactive items have `role="option"` with `id`s, and the input has `role="combobox"` with `aria-activedescendant` linking to the currently focused option's `id`.
## 2026-03-24 - Loading Feedback on Destructive/Creation Actions
**Learning:** Administrative actions like deleting or creating blocks/categories can take a moment to process. Providing immediate visual feedback by replacing the action icon with a spinner and disabling the button improves user confidence and prevents accidental double-submissions.
**Action:** Always link async state variables (like `isSavingCategory` or `isDeletingBlock`) to their respective action buttons to show a loading spinner and disable the button while the action is processing.
