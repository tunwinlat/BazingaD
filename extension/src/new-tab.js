import { getTitle, onTitleChange } from './storage.js';

const heading = document.querySelector('#dashboard-title');
const status = document.querySelector('#status');

function showTitle(title) {
  heading.textContent = title;
  document.title = title;
  status.textContent = '';
}

try {
  onTitleChange(showTitle);
  showTitle(await getTitle());
} catch {
  status.textContent = 'Could not load settings for this browser profile.';
}
