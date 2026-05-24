import { describe, it, expect } from 'vitest';
import { isSafeUrl } from '../lib/security.ts';

describe('isSafeUrl', () => {
  describe('IPv4 Address Validation', () => {
    it('returns true for public IPv4 addresses', () => {
      expect(isSafeUrl('http://1.1.1.1')).toBe(true);
      expect(isSafeUrl('https://8.8.8.8')).toBe(true);
      expect(isSafeUrl('http://13.33.37.147')).toBe(true);
    });

    it('returns false for private IPv4 addresses', () => {
      expect(isSafeUrl('http://127.0.0.1')).toBe(false);
      expect(isSafeUrl('http://10.0.0.1')).toBe(false);
      expect(isSafeUrl('http://172.16.0.1')).toBe(false);
      expect(isSafeUrl('http://192.168.1.1')).toBe(false);
      expect(isSafeUrl('http://169.254.0.1')).toBe(false);
      expect(isSafeUrl('http://0.0.0.0')).toBe(false);
      expect(isSafeUrl('http://100.64.0.1')).toBe(false);
      expect(isSafeUrl('http://224.0.0.1')).toBe(false);
    });

    it('handles malformed IPv4-like addresses', () => {
      expect(isSafeUrl('http://127.1')).toBe(false);
      expect(isSafeUrl('http://192.168.1')).toBe(false);
      expect(isSafeUrl('http://1.2.3.4.5')).toBe(false);
      expect(isSafeUrl('http://127.0.0.a')).toBe(false);
    });

    it('returns false for integer and hex IP representations (SSRF bypass)', () => {
      expect(isSafeUrl('http://2130706433')).toBe(false);
      expect(isSafeUrl('http://0x7f000001')).toBe(false);
      expect(isSafeUrl('http://017700000001')).toBe(false);
    });
  });

  describe('Hostname Validation', () => {
    it('returns false for localhost and local domains', () => {
      expect(isSafeUrl('http://localhost')).toBe(false);
      expect(isSafeUrl('http://localhost.localdomain')).toBe(false);
      expect(isSafeUrl('http://loopback')).toBe(false);
      expect(isSafeUrl('http://example.local')).toBe(false);
      expect(isSafeUrl('http://test.test')).toBe(false);
      expect(isSafeUrl('http://some.invalid')).toBe(false);
      expect(isSafeUrl('http://my.localhost')).toBe(false);
      expect(isSafeUrl('http://site.example')).toBe(false);
    });

    it('returns true for valid public domains', () => {
      expect(isSafeUrl('http://google.com.')).toBe(true);
      expect(isSafeUrl('http://example.com')).toBe(true);
      expect(isSafeUrl('https://example.com')).toBe(true);
    });
  });

  describe('IPv6 Address Validation', () => {
    it('returns true for public IPv6 addresses', () => {
      expect(isSafeUrl('http://[2001:4860:4860::8888]')).toBe(true);
    });

    it('returns false for private IPv6 addresses', () => {
      expect(isSafeUrl('http://[::1]')).toBe(false);
      expect(isSafeUrl('http://[fe80::1]')).toBe(false);
      expect(isSafeUrl('http://[fc00::1]')).toBe(false);
    });
  });

  describe('Protocol and Input Validation', () => {
    it('returns false for non-HTTP(S) protocols', () => {
      expect(isSafeUrl('ftp://example.com')).toBe(false);
      expect(isSafeUrl('file:///etc/passwd')).toBe(false);
      expect(isSafeUrl('gopher://example.com')).toBe(false);
    });

    it('returns false for null, undefined, empty, or invalid input', () => {
      expect(isSafeUrl(null)).toBe(false);
      expect(isSafeUrl(undefined)).toBe(false);
      expect(isSafeUrl('')).toBe(false);
      expect(isSafeUrl('not-a-url')).toBe(false);
    });
  });
});
