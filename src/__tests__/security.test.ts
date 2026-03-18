import { test, describe } from 'node:test';
import assert from 'node:assert';
import { isSafeUrl } from '../lib/security.ts';

describe('isSafeUrl', () => {
  describe('IPv4 Address Validation', () => {
    test('returns true for public IPv4 addresses', () => {
      assert.strictEqual(isSafeUrl('http://1.1.1.1'), true);
      assert.strictEqual(isSafeUrl('https://8.8.8.8'), true);
      assert.strictEqual(isSafeUrl('http://13.33.37.147'), true);
    });

    test('returns false for private IPv4 addresses', () => {
      assert.strictEqual(isSafeUrl('http://127.0.0.1'), false);
      assert.strictEqual(isSafeUrl('http://10.0.0.1'), false);
      assert.strictEqual(isSafeUrl('http://172.16.0.1'), false);
      assert.strictEqual(isSafeUrl('http://192.168.1.1'), false);
      assert.strictEqual(isSafeUrl('http://169.254.0.1'), false);
      assert.strictEqual(isSafeUrl('http://0.0.0.0'), false);
      assert.strictEqual(isSafeUrl('http://100.64.0.1'), false);
      assert.strictEqual(isSafeUrl('http://224.0.0.1'), false);
    });

    test('handles malformed IPv4-like addresses', () => {
      // These currently skip isPrivateIPv4 due to strict regex
      // but should ideally be caught as unsafe if they represent private IPs
      assert.strictEqual(isSafeUrl('http://127.1'), false, 'Should block shortened loopback');
      assert.strictEqual(isSafeUrl('http://192.168.1'), false, 'Should block incomplete private IP');
      assert.strictEqual(isSafeUrl('http://1.2.3.4.5'), false, 'Should block too many segments if they match private patterns');
      assert.strictEqual(isSafeUrl('http://127.0.0.a'), false, 'Should block non-numeric segments in private range');
    });
  });

  describe('Hostname Validation', () => {
    test('returns false for reserved hostnames', () => {
      assert.strictEqual(isSafeUrl('http://localhost'), false);
      assert.strictEqual(isSafeUrl('http://localhost.localdomain'), false);
      assert.strictEqual(isSafeUrl('http://loopback'), false);
      assert.strictEqual(isSafeUrl('http://example.local'), false);
      assert.strictEqual(isSafeUrl('http://test.test'), false);
      assert.strictEqual(isSafeUrl('http://some.invalid'), false);
      assert.strictEqual(isSafeUrl('http://my.localhost'), false);
      assert.strictEqual(isSafeUrl('http://site.example'), false);
    });

    test('handles trailing dots in hostnames', () => {
      assert.strictEqual(isSafeUrl('http://google.com.'), true);
      assert.strictEqual(isSafeUrl('http://localhost.'), false);
    });
  });

  describe('IPv6 Address Validation', () => {
    test('returns true for public IPv6 addresses', () => {
      assert.strictEqual(isSafeUrl('http://[2001:4860:4860::8888]'), true);
    });

    test('returns false for private IPv6 addresses', () => {
      assert.strictEqual(isSafeUrl('http://[::1]'), false);
      assert.strictEqual(isSafeUrl('http://[fe80::1]'), false);
      assert.strictEqual(isSafeUrl('http://[fc00::1]'), false);
    });
  });

  describe('Protocol Validation', () => {
    test('returns true for http and https', () => {
      assert.strictEqual(isSafeUrl('http://example.com'), true);
      assert.strictEqual(isSafeUrl('https://example.com'), true);
    });

    test('returns false for other protocols', () => {
      assert.strictEqual(isSafeUrl('ftp://example.com'), false);
      assert.strictEqual(isSafeUrl('file:///etc/passwd'), false);
      assert.strictEqual(isSafeUrl('gopher://example.com'), false);
    });
  });

  describe('General Error Handling', () => {
    test('returns false for null, undefined, or empty string', () => {
      assert.strictEqual(isSafeUrl(null), false);
      assert.strictEqual(isSafeUrl(undefined), false);
      assert.strictEqual(isSafeUrl(''), false);
    });

    test('returns false for invalid URLs', () => {
      assert.strictEqual(isSafeUrl('not-a-url'), false);
    });
  });
});
