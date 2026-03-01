import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiters for different endpoints
const rateLimiters = {
  // Login attempts: 5 per 15 minutes per IP
  login: new RateLimiterMemory({
    keyPrefix: 'login',
    points: 5,
    duration: 15 * 60, // 15 minutes
  }),
  
  // API general: 100 per minute per IP
  api: new RateLimiterMemory({
    keyPrefix: 'api',
    points: 100,
    duration: 60, // 1 minute
  }),
  
  // Sensitive operations (password change, TOTP setup): 10 per hour
  sensitive: new RateLimiterMemory({
    keyPrefix: 'sensitive',
    points: 10,
    duration: 60 * 60, // 1 hour
  }),
  
  // Health check: 10 per minute
  health: new RateLimiterMemory({
    keyPrefix: 'health',
    points: 10,
    duration: 60, // 1 minute
  }),
};

export type RateLimitType = keyof typeof rateLimiters;

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
  // Try various headers to get the real client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // Use a unique identifier per request if we can't determine IP
  // This prevents rate limiting all requests when IP is unknown
  return request.headers.get('user-agent') || 'default';
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
 * Middleware wrapper for rate limiting
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
