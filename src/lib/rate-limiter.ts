import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiters for different endpoints with optimized settings
const rateLimiters = {
  // Login attempts: 5 per 15 minutes per IP - strict to prevent brute force
  login: new RateLimiterMemory({
    keyPrefix: 'login',
    points: 5,
    duration: 15 * 60, // 15 minutes
  }),
  
  // API general: 100 per minute per IP - generous for normal usage
  api: new RateLimiterMemory({
    keyPrefix: 'api',
    points: 100,
    duration: 60, // 1 minute
  }),
  
  // Sensitive operations (password change, TOTP setup): 10 per minute
  sensitive: new RateLimiterMemory({
    keyPrefix: 'sensitive',
    points: 10,
    duration: 60, // 1 minute
  }),
  
  // Health check: 30 per minute - allow frequent health checks
  health: new RateLimiterMemory({
    keyPrefix: 'health',
    points: 30,
    duration: 60, // 1 minute
  }),

  // Geocode: 20 per minute - prevent abuse of external Open-Meteo API
  geocode: new RateLimiterMemory({
    keyPrefix: 'geocode',
    points: 20,
    duration: 60, // 1 minute
  }),
};

export type RateLimitType = keyof typeof rateLimiters;

/**
 * Get client IP from request with fallback strategies
 */
function getClientIP(request: NextRequest): string {
  // Try request.ip first (provided by Next.js in deployed environments)
  if (request.ip) return request.ip;

  // Try various headers to get the real client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a single bucket if we truly can't determine IP
  // Do not use user-agent as it can be easily randomized to bypass rate limiting
  return 'unknown-ip';
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  request: NextRequest,
  type: RateLimitType = 'api'
): Promise<{ allowed: boolean; limiterRes?: RateLimiterRes }> {
  const ip = getClientIP(request);
  const limiter = rateLimiters[type];
  
  try {
    const limiterRes = await limiter.consume(ip);
    return { allowed: true, limiterRes };
  } catch (rejRes) {
    if (rejRes instanceof RateLimiterRes) {
      return { allowed: false, limiterRes: rejRes };
    }
    throw rejRes;
  }
}

/**
 * Middleware wrapper for rate limiting with optimized headers
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  type: RateLimitType = 'api'
): Promise<NextResponse | null> {
  const { allowed, limiterRes } = await checkRateLimit(request, type);
  
  if (!allowed) {
    const retryAfter = Math.ceil((limiterRes?.msBeforeNext ?? 60000) / 1000);
    
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(rateLimiters[type].points),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + retryAfter),
          'Cache-Control': 'no-store',
        },
      }
    );
  }
  
  return null;
}

/**
 * Get rate limit headers for successful requests
 */
export function getRateLimitHeaders(
  limiterRes: RateLimiterRes,
  type: RateLimitType = 'api'
): Record<string, string> {
  const limiter = rateLimiters[type];
  
  return {
    'X-RateLimit-Limit': String(limiter.points),
    'X-RateLimit-Remaining': String(limiterRes.remainingPoints),
    'X-RateLimit-Reset': String(Math.ceil((Date.now() + limiterRes.msBeforeNext) / 1000)),
  };
}
