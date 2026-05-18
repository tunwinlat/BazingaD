/**
 * Get client IP from request with fallback strategies
 */
export function getClientIP(request: { ip?: string; headers: { get: (name: string) => string | null } }): string {
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
