'use client';

import { useEffect, useState } from 'react';

// Default fun favicon - a stylized rocket/launch icon
const DEFAULT_FAVICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%236366f1'/%3E%3Cstop offset='100%25' style='stop-color:%238b5cf6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='20' fill='url(%23g)'/%3E%3Cpath d='M50 25c-8 0-15 8-15 20 0 10 5 20 15 30 10-10 15-20 15-30 0-12-7-20-15-20z' fill='white' opacity='0.9'/%3E%3Ccircle cx='50' cy='45' r='8' fill='%236366f1'/%3E%3Cpath d='M35 65c-5 5-10 15-10 25h20c-5-10-10-20-10-25z' fill='white' opacity='0.7'/%3E%3Cpath d='M65 65c5 5 10 15 10 25h-20c5-10 10-20 10-25z' fill='white' opacity='0.7'/%3E%3C/svg%3E`;

export default function DynamicFavicon() {
  const [favicon, setFavicon] = useState<string>(DEFAULT_FAVICON);
  const [siteTitle, setSiteTitle] = useState<string>('Start Page');

  useEffect(() => {
    const controller = new AbortController();

    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/general', { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          if (data.favicon) {
            setFavicon(data.favicon);
          }
          if (data.siteTitle) {
            setSiteTitle(data.siteTitle);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch favicon settings:', error);
        }
      }
    };

    fetchSettings();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    // Update favicon
    const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    let createdLink: HTMLLinkElement | null = null;
    if (link) {
      link.href = favicon;
    } else {
      createdLink = document.createElement('link');
      createdLink.rel = 'icon';
      createdLink.type = 'image/svg+xml';
      createdLink.href = favicon;
      document.head.appendChild(createdLink);
    }

    const prevTitle = document.title;
    document.title = siteTitle;

    return () => {
      if (createdLink) {
        document.head.removeChild(createdLink);
      }
      document.title = prevTitle;
    };
  }, [favicon, siteTitle]);

  return null;
}
