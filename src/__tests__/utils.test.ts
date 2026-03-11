import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getDomain } from '../lib/utils.ts';

describe('getDomain', () => {
  test('returns domain for standard URL with www', () => {
    assert.strictEqual(getDomain('https://www.google.com'), 'google.com');
  });

  test('returns domain for standard URL without www', () => {
    assert.strictEqual(getDomain('https://github.com/twlatx'), 'github.com');
  });

  test('returns domain for URL with subdomain', () => {
    assert.strictEqual(getDomain('https://app.example.co.uk'), 'app.example.co.uk');
  });

  test('returns domain for URL with port', () => {
    assert.strictEqual(getDomain('http://localhost:3000'), 'localhost');
  });

  test('returns input string for invalid URL (error handling)', () => {
    const invalidUrl = 'not-a-url';
    assert.strictEqual(getDomain(invalidUrl), invalidUrl);
  });

  test('returns input string for empty string (error handling)', () => {
    assert.strictEqual(getDomain(''), '');
  });

  test('returns "null" for string "null" (error handling)', () => {
    assert.strictEqual(getDomain('null'), 'null');
  });

  test('returns domain for URL with multiple subdomains', () => {
    assert.strictEqual(getDomain('https://very.deep.subdomain.example.com'), 'very.deep.subdomain.example.com');
  });
});
