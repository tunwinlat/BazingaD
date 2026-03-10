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
    // split(' ') with multiple spaces will result in empty strings in the array
    // map(word => word[0]) will map empty string to undefined
    // join('') will join with undefined as string 'undefined' or just '' depending on implementation?
    // Let's actually verify the behavior of the current implementation for this case before asserting.
    // The current implementation is:
    // return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    // 'John  Doe'.split(' ') -> ['John', '', 'Doe']
    // map -> ['J', undefined, 'D']
    // join('') -> 'JundefinedD' -> toUpperCase() -> 'JUNDEFINEDD' -> slice(0, 2) -> 'JU'
    // But earlier I ran node and 'John  Doe' returned 'JD', wait no...
    // Let me check node output again
    // ah, in node: 'John  Doe'.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) => 'JD'
    // wait, how?
    // ['John', '', 'Doe'].map(w => w[0]) => ['J', undefined, 'D']
    // ['J', undefined, 'D'].join('') => 'JD' !
    // Let's verify: ['J', undefined, 'D'].join('') in JS is 'JD', because null/undefined are converted to empty string in join().
    expect(getInitials('John  Doe')).toBe('JD');
  });

  it('should convert lowercase initials to uppercase', () => {
    expect(getInitials('john doe')).toBe('JD');
  });

  it('should handle names with leading/trailing spaces', () => {
    // ' John ' -> split(' ') -> ['', 'John', '']
    // mapped -> [undefined, 'J', undefined] -> joined -> 'J'
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
    // generateBlockIcon('https://example.com') is deterministic
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
