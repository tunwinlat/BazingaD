import { describe, it, expect } from 'vitest';
import { getInitials, getDomain, generateBlockIcon, getFavicon, getBlockIcon, sortAlphabetically } from './utils';

describe('getInitials', () => {
  it('should return initials for a standard first and last name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('should return a single initial for a single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('should return two initials for a name with three parts', () => {
    expect(getInitials('John Robert Doe')).toBe('JR');
  });

  it('should return empty string for an empty string', () => {
    expect(getInitials('')).toBe('');
  });

  it('should handle extra spaces between names gracefully', () => {
    expect(getInitials('John  Doe')).toBe('JD');
  });

  it('should convert lowercase initials to uppercase', () => {
    expect(getInitials('john doe')).toBe('JD');
  });

  it('should handle names with leading/trailing spaces', () => {
    expect(getInitials(' John ')).toBe('J');
  });
});

describe('getDomain', () => {
  it('should extract the domain from a standard https URL', () => {
    expect(getDomain('https://example.com')).toBe('example.com');
  });

  it('should extract the domain from an http URL', () => {
    expect(getDomain('http://example.com')).toBe('example.com');
  });

  it('should strip out "www." from the domain', () => {
    expect(getDomain('https://www.example.com')).toBe('example.com');
  });

  it('should extract the domain from a URL with a path and query parameters', () => {
    expect(getDomain('https://example.com/path/to/page?query=123')).toBe('example.com');
  });

  it('should extract the domain from a URL with a subdomain (not www)', () => {
    expect(getDomain('https://sub.example.com')).toBe('sub.example.com');
  });

  it('should return the original string if the URL is invalid', () => {
    expect(getDomain('not-a-valid-url')).toBe('not-a-valid-url');
  });
});

describe('generateBlockIcon', () => {
  it('should return a string that starts with data URI', () => {
    const icon = generateBlockIcon('https://example.com');
    expect(icon).toMatch(/^data:image\/svg\+xml,/);
  });

  it('should generate a valid SVG data URI for a normal URL', () => {
    const icon = generateBlockIcon('https://example.com');
    expect(icon).toMatch(/^data:image\/svg\+xml,%3Csvg/);
    expect(icon).toContain('linearGradient');
  });

  it('should trigger the catch block and return default SVG when an error occurs', () => {
    const icon = generateBlockIcon(null as unknown as string);
    expect(icon).toMatch(/^data:image\/svg\+xml,%3Csvg/);
    expect(icon).toContain('linearGradient');
    expect(icon).toContain('%3Cstop%20offset%3D%220%25%22%20style%3D%22stop-color%3A%236366f1%22%2F%3E');
    expect(icon).toContain('%3Cstop%20offset%3D%22100%25%22%20style%3D%22stop-color%3A%238b5cf6%22%2F%3E');
    expect(icon).toContain('%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2225%22%20fill%3D%22rgba(255%2C255%2C255%2C0.15)%22%2F%3E');
  });

  it('should return a deterministic icon for the same URL', () => {
    const icon1 = generateBlockIcon('https://example.com');
    const icon2 = generateBlockIcon('https://example.com');
    expect(icon1).toBe(icon2);
  });
});

describe('getFavicon', () => {
  it('should return the Google favicon service URL for a valid URL', () => {
    expect(getFavicon('https://example.com')).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=128');
  });

  it('should return null for an invalid URL', () => {
    expect(getFavicon('not-a-valid-url')).toBeNull();
  });
});

describe('getBlockIcon', () => {
  it('should return the provided custom icon if present', () => {
    const block = { icon: 'custom-icon.png', url: 'https://example.com' };
    expect(getBlockIcon(block)).toBe('custom-icon.png');
  });

  it('should fall back to generateBlockIcon if no custom icon is provided', () => {
    const block = { url: 'https://example.com' };
    const expectedIcon = generateBlockIcon('https://example.com');
    expect(getBlockIcon(block)).toBe(expectedIcon);
  });
});

describe('sortAlphabetically', () => {
  it('should sort items by title alphabetically', () => {
    const items = [
      { id: 1, title: 'Zebra' },
      { id: 2, title: 'apple' },
      { id: 3, title: 'Banana' },
    ];

    const sorted = sortAlphabetically(items);

    expect(sorted).toEqual([
      { id: 2, title: 'apple' },
      { id: 3, title: 'Banana' },
      { id: 1, title: 'Zebra' },
    ]);
  });

  it('should not mutate the original array', () => {
    const items = [
      { id: 1, title: 'Zebra' },
      { id: 2, title: 'Apple' },
    ];

    sortAlphabetically(items);

    expect(items[0].title).toBe('Zebra');
  });
});
