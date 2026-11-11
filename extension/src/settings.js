import { getTitle, saveTitle } from './storage.js';

const form = document.querySelector('form');
const fields = form.querySelector('fieldset');
const title = form.querySelector('#dashboard-title');
const status = document.querySelector('#status');

try {
  title.value = await getTitle();
  fields.disabled = false;
} catch {
  status.textContent = 'Could not load settings. Reload this page to try again.';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (fields.disabled) return;

  const value = title.value.trim();
  if (!value) {
    status.textContent = 'Enter a dashboard title.';
    title.focus();
    return;
  }

  fields.disabled = true;
  try {
    await saveTitle(value);
    title.value = value;
    status.textContent = 'Settings saved.';
  } catch {
    status.textContent = 'Could not save settings. Try again.';
  } finally {
    fields.disabled = false;
  }
});
