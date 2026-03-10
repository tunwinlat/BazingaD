/**
 * Validates if a URL is safe to fetch from a server environment.
 * Prevents SSRF by blocking access to local, private, and reserved IP ranges.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);

    // Only allow http and https protocols
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return false;
    }

    let hostname = parsedUrl.hostname.toLowerCase();

    // Remove trailing dot if present
    if (hostname.endsWith('.')) {
      hostname = hostname.slice(0, -1);
    }

    // Block localhost and common local names
    const localNames = ['localhost', 'localhost.localdomain', 'loopback'];
    if (
      localNames.includes(hostname) ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.test') ||
      hostname.endsWith('.invalid') ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.example')
    ) {
      return false;
    }

    // Check for IPv4 addresses
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(hostname)) {
      return !isPrivateIPv4(hostname);
    }

    // Check for IPv6 addresses
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      const ipv6 = hostname.slice(1, -1);
      return !isPrivateIPv6(ipv6);
    }

    // Most basic IPv6 check without brackets
    if (hostname.includes(':')) {
      return !isPrivateIPv6(hostname);
    }

    return true;
  } catch {
    return false;
  }
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.some(isNaN) || parts.length !== 4) return true;

  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return true;

  // 10.0.0.0/8 (Private)
  if (parts[0] === 10) return true;

  // 172.16.0.0/12 (Private)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16 (Private)
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 169.254.0.0/16 (Link-local)
  if (parts[0] === 169 && parts[1] === 254) return true;

  // 0.0.0.0/8 (Current network)
  if (parts[0] === 0) return true;

  // 100.64.0.0/10 (Shared address space)
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (parts[0] === 192 && parts[1] === 0 && parts[2] === 0) return true;

  // 224.0.0.0/4 (Multicast)
  if (parts[0] >= 224) return true;

  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // ::1 (Loopback)
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;

  // fe80::/10 (Link-local)
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') ||
      normalized.startsWith('fea') || normalized.startsWith('feb')) return true;

  // fc00::/7 (Unique local)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  return false;
}
