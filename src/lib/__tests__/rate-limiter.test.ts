import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock rate-limiter-flexible BEFORE importing the module under test
vi.mock('rate-limiter-flexible', () => {
  const consumeMock = vi.fn();

  class MockRateLimiterRes {
    remainingPoints: number;
    msBeforeNext: number;
    consumedPoints: number;
    isFirstInDuration: boolean;

    constructor(remainingPoints: number, msBeforeNext: number, consumedPoints: number, isFirstInDuration: boolean) {
      this.remainingPoints = remainingPoints;
      this.msBeforeNext = msBeforeNext;
      this.consumedPoints = consumedPoints;
      this.isFirstInDuration = isFirstInDuration;
    }
  }

  // Needs to be an actual constructor
  class MockRateLimiterMemory {
    points = 100;
    consume = consumeMock;
  }

  return {
    RateLimiterMemory: MockRateLimiterMemory,
    RateLimiterRes: MockRateLimiterRes,
    __consumeMock: consumeMock,
  };
});

import { checkRateLimit, rateLimitMiddleware, getRateLimitHeaders } from '../rate-limiter';
import * as rateLimiterFlexibleModule from 'rate-limiter-flexible';
const { __consumeMock, RateLimiterRes: MockRateLimiterRes } = rateLimiterFlexibleModule as any;

describe('rate-limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('returns allowed: true when consume succeeds', async () => {
      const mockLimiterRes = new MockRateLimiterRes(99, 1000, 1, false);
      __consumeMock.mockResolvedValueOnce(mockLimiterRes);

      const req = new NextRequest('http://localhost', {
        headers: new Headers({ 'x-forwarded-for': '192.168.1.1' }),
      });

      const result = await checkRateLimit(req, 'api');

      expect(result.allowed).toBe(true);
      expect(result.limiterRes).toBe(mockLimiterRes);
      expect(__consumeMock).toHaveBeenCalledWith('192.168.1.1');
    });

    it('returns allowed: false when consume throws RateLimiterRes (limit exceeded)', async () => {
      const mockRejRes = new MockRateLimiterRes(0, 5000, 100, false);
      __consumeMock.mockRejectedValueOnce(mockRejRes);

      const req = new NextRequest('http://localhost', {
        headers: new Headers({ 'x-real-ip': '10.0.0.1' }),
      });

      const result = await checkRateLimit(req, 'api');

      expect(result.allowed).toBe(false);
      expect(result.limiterRes).toBe(mockRejRes);
      expect(__consumeMock).toHaveBeenCalledWith('10.0.0.1');
    });

    it('throws error if consume throws something other than RateLimiterRes', async () => {
      const error = new Error('Database connection failed');
      __consumeMock.mockRejectedValueOnce(error);

      const req = new NextRequest('http://localhost', {
        headers: new Headers({ 'user-agent': 'curl/7.68.0' }),
      });

      await expect(checkRateLimit(req, 'api')).rejects.toThrow('Database connection failed');
      expect(__consumeMock).toHaveBeenCalledWith('curl/7.68.0');
    });

    it('uses "default" IP if no useful headers are present', async () => {
      const mockLimiterRes = new MockRateLimiterRes(99, 1000, 1, false);
      __consumeMock.mockResolvedValueOnce(mockLimiterRes);

      const req = new NextRequest('http://localhost'); // No headers

      const result = await checkRateLimit(req, 'api');

      expect(result.allowed).toBe(true);
      expect(__consumeMock).toHaveBeenCalledWith('default');
    });
  });

  describe('rateLimitMiddleware', () => {
    it('returns null if request is allowed', async () => {
      const mockLimiterRes = new MockRateLimiterRes(99, 1000, 1, false);
      __consumeMock.mockResolvedValueOnce(mockLimiterRes);

      const req = new NextRequest('http://localhost');

      const result = await rateLimitMiddleware(req, 'api');

      expect(result).toBeNull();
    });

    it('returns NextResponse with 429 status and headers if limit exceeded', async () => {
      const mockRejRes = new MockRateLimiterRes(0, 60000, 100, false); // 60 seconds
      __consumeMock.mockRejectedValueOnce(mockRejRes);

      const req = new NextRequest('http://localhost');

      const result = await rateLimitMiddleware(req, 'api');

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(429);

      const data = await result?.json();
      expect(data).toEqual({ error: 'Too many requests. Please try again later.' });

      // Verify headers
      expect(result?.headers.get('Retry-After')).toBe('60'); // 60000ms / 1000
      expect(result?.headers.get('X-RateLimit-Limit')).toBe('100'); // the mocked API limit points
      expect(result?.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(result?.headers.get('Cache-Control')).toBe('no-store');
      expect(result?.headers.has('X-RateLimit-Reset')).toBe(true);
    });
  });

  describe('getRateLimitHeaders', () => {
    it('returns correct headers based on RateLimiterRes and type', () => {
      // Use fake timers to test Date.now() logic predictability
      vi.useFakeTimers();
      vi.setSystemTime(new Date(1000000)); // Set time to 1000 seconds

      const mockRes = new MockRateLimiterRes(50, 5000, 50, false); // msBeforeNext: 5000

      const headers = getRateLimitHeaders(mockRes as any, 'api');

      expect(headers).toEqual({
        'X-RateLimit-Limit': '100', // Mocked points for 'api'
        'X-RateLimit-Remaining': '50',
        // (1000000 + 5000) / 1000 = 1005
        'X-RateLimit-Reset': '1005',
      });

      vi.useRealTimers();
    });
  });
});
