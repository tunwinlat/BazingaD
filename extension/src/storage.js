const storage = (globalThis.browser ?? globalThis.chrome).storage;
const titleKey = 'dashboardTitle';
const defaultTitle = 'BazingaD';

export async function getTitle() {
  const settings = await storage.local.get(titleKey);
  return settings[titleKey] ?? defaultTitle;
}

export async function saveTitle(title) {
  await storage.local.set({ [titleKey]: title.trim() || defaultTitle });
}

export function onTitleChange(listener) {
  storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && Object.hasOwn(changes, titleKey)) {
      listener(changes[titleKey].newValue ?? defaultTitle);
    }
  });
}
