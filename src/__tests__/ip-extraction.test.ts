import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getClientIP } from '../lib/ip-utils.ts';

describe('getClientIP', () => {
  test('returns request.ip if present', () => {
    const req = {
      ip: '192.168.1.100',
      headers: {
        get: (name: string) => {
          if (name === 'x-forwarded-for') return '10.0.0.1, 10.0.0.2';
          if (name === 'x-real-ip') return '10.0.0.3';
          return null;
        }
      }
    };
    assert.strictEqual(getClientIP(req), '192.168.1.100');
  });

  test('returns the first x-forwarded-for IP if request.ip is missing', () => {
    const req = {
      headers: {
        get: (name: string) => {
          if (name === 'x-forwarded-for') return '10.0.0.1, 10.0.0.2';
          if (name === 'x-real-ip') return '10.0.0.3';
          return null;
        }
      }
    };
    assert.strictEqual(getClientIP(req), '10.0.0.1');
  });

  test('returns x-real-ip if x-forwarded-for and request.ip are missing', () => {
    const req = {
      headers: {
        get: (name: string) => {
          if (name === 'x-real-ip') return '10.0.0.3';
          return null;
        }
      }
    };
    assert.strictEqual(getClientIP(req), '10.0.0.3');
  });

  test('returns "unknown-ip" if no IP information is available', () => {
    const req = {
      headers: {
        get: () => null
      }
    };
    assert.strictEqual(getClientIP(req), 'unknown-ip');
  });

  test('handles x-forwarded-for with spaces correctly', () => {
    const req = {
      headers: {
        get: (name: string) => {
          if (name === 'x-forwarded-for') return '  172.16.0.1  , 172.16.0.2';
          return null;
        }
      }
    };
    assert.strictEqual(getClientIP(req), '172.16.0.1');
  });
});
