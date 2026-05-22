import { describe, it, expect } from 'vitest';
import { getDomain } from '../lib/utils';

describe('getDomain', () => {
  it('returns domain for standard URL with www', () => {
    expect(getDomain('https://www.google.com')).toBe('google.com');
  });

  it('returns domain for standard URL without www', () => {
    expect(getDomain('https://github.com/twlatx')).toBe('github.com');
  });

  it('returns domain for URL with subdomain', () => {
    expect(getDomain('https://app.example.co.uk')).toBe('app.example.co.uk');
  });

  it('returns domain for URL with port', () => {
    expect(getDomain('http://localhost:3000')).toBe('localhost');
  });

  it('returns input string for invalid URL (error handling)', () => {
    const invalidUrl = 'not-a-url';
    expect(getDomain(invalidUrl)).toBe(invalidUrl);
  });

  it('returns input string for empty string (error handling)', () => {
    expect(getDomain('')).toBe('');
  });

  it('returns "null" for string "null" (error handling)', () => {
    expect(getDomain('null')).toBe('null');
  });

  it('returns domain for URL with multiple subdomains', () => {
    expect(getDomain('https://very.deep.subdomain.example.com')).toBe('very.deep.subdomain.example.com');
  });
});
