import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSessionToken, verifyAuth } from './auth';
import { prisma } from './prisma';
import { cookies } from 'next/headers';

vi.mock('./prisma', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('generateSessionToken', () => {
  it('should generate a string of length 64', () => {
    const token = generateSessionToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBe(64);
  });

  it('should only contain valid hexadecimal characters', () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should generate random, unique tokens', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();
    const token3 = generateSessionToken();

    expect(token1).not.toBe(token2);
    expect(token1).not.toBe(token3);
    expect(token2).not.toBe(token3);
  });
});

describe('verifyAuth', () => {
  const mockCookieStore = {
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default cookie mock
    (cookies as any).mockResolvedValue(mockCookieStore);
  });

  it('should return null if auth-token cookie is missing', async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const result = await verifyAuth();
    expect(result).toBeNull();
  });

  it('should return null if token starts with dash_', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'dash_123' });

    const result = await verifyAuth();
    expect(result).toBeNull();
  });

  it('should return null if session is not found in database', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'valid_token' });
    (prisma.session.findUnique as any).mockResolvedValue(null);

    const result = await verifyAuth();
    expect(result).toBeNull();
  });

  it('should return null and delete session if session is expired', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'valid_token' });

    const pastDate = new Date(Date.now() - 10000); // 10 seconds ago
    const mockSession = {
      id: 'session_1',
      token: 'valid_token',
      userId: 'user_1',
      createdAt: new Date(),
      expiresAt: pastDate,
      user: {
        id: 'user_1',
        passwordChangedAt: new Date(Date.now() - 20000),
      },
    };

    (prisma.session.findUnique as any).mockResolvedValue(mockSession);

    const result = await verifyAuth();

    expect(result).toBeNull();
    expect(prisma.session.delete).toHaveBeenCalledWith({ where: { id: 'session_1' } });
  });

  it('should return null and delete session if password was changed after session creation', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'valid_token' });

    const futureDate = new Date(Date.now() + 10000); // 10 seconds in future
    const sessionCreatedAt = new Date(Date.now() - 20000); // 20 seconds ago
    const passwordChangedAt = new Date(Date.now() - 10000); // 10 seconds ago (after session created)

    const mockSession = {
      id: 'session_1',
      token: 'valid_token',
      userId: 'user_1',
      createdAt: sessionCreatedAt,
      expiresAt: futureDate,
      user: {
        id: 'user_1',
        passwordChangedAt: passwordChangedAt,
      },
    };

    (prisma.session.findUnique as any).mockResolvedValue(mockSession);

    const result = await verifyAuth();

    expect(result).toBeNull();
    expect(prisma.session.delete).toHaveBeenCalledWith({ where: { id: 'session_1' } });
  });

  it('should return userId and sessionToken for a valid session', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'valid_token' });

    const futureDate = new Date(Date.now() + 10000);
    const sessionCreatedAt = new Date(Date.now() - 20000);
    const passwordChangedAt = new Date(Date.now() - 30000); // Before session created

    const mockSession = {
      id: 'session_1',
      token: 'valid_token',
      userId: 'user_1',
      createdAt: sessionCreatedAt,
      expiresAt: futureDate,
      user: {
        id: 'user_1',
        passwordChangedAt: passwordChangedAt,
      },
    };

    (prisma.session.findUnique as any).mockResolvedValue(mockSession);

    const result = await verifyAuth();

    expect(result).toEqual({
      userId: 'user_1',
      sessionToken: 'valid_token',
    });
    expect(prisma.session.delete).not.toHaveBeenCalled();
  });

  it('should return null if an error is thrown', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'valid_token' });
    (prisma.session.findUnique as any).mockRejectedValue(new Error('DB Error'));

    // Silence console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await verifyAuth();

    expect(result).toBeNull();

    consoleSpy.mockRestore();
  });
});
