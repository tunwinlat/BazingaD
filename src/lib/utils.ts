export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getDomain = (url: string): string => {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch {
    return url;
  }
};

export const getFavicon = (url: string): string | null => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
};

export const sortAlphabetically = <T extends { title: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const titleA = a.title.toLowerCase();
    const titleB = b.title.toLowerCase();
    return titleA.localeCompare(titleB);
  });
};
