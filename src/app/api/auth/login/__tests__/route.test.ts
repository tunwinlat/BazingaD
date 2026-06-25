import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { settingsCache } from '@/lib/cache';
import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';

vi.mock('@/lib/ip-utils', () => ({
  getClientIP: vi.fn((req: any) => {
    const xForwardedFor = req.headers.get('x-forwarded-for');
    return xForwardedFor ? xForwardedFor : '127.0.0.1';
  })
}));

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    settings: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  createSession: vi.fn(),
  getCookieOptions: vi.fn(() => ({ httpOnly: true, secure: true })),
}));

vi.mock('@/lib/cache', () => ({
  settingsCache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock('otpauth', () => {
  return {
    TOTP: vi.fn().mockImplementation(function() {
      return { validate: vi.fn() };
    }),
    Secret: {
      fromBase32: vi.fn(),
    },
  };
});

describe('Login API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validLoginData = {
    username: 'testuser',
    password: 'password123',
  };

  function createRequest(body: unknown = validLoginData, headers: Record<string, string> = {}) {
    const init: RequestInit = {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        ...headers,
      }),
    };
    if (body !== null) {
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    return new Request('http://localhost:3000/api/auth/login', init);
  }

  describe('Validation and Request Parsing', () => {
    it('returns 413 if content-length is too large', async () => {
      const request = createRequest(validLoginData, {
        'content-length': (1024 * 1024 + 1).toString(),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(413);
      expect(data).toEqual({ error: 'Request body too large' });
    });

    it('returns 400 for invalid JSON in body', async () => {
      const request = createRequest('invalid json');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid JSON in request body' });
    });

    it('returns 400 for Zod validation failure', async () => {
      // Missing password
      const request = createRequest({ username: 'testuser' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('returns 401 for invalid credentials (user not found)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const request = createRequest(validLoginData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Invalid credentials' });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        select: {
          id: true,
          username: true,
          password: true,
          totpEnabled: true,
          totpVerified: true,
          totpSecret: true,
        },
      });
    });

    it('returns 401 for invalid credentials (wrong password)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: '1',
        username: 'testuser',
        password: 'hashedpassword',
      } as any);
      vi.mocked(bcrypt.compare as any).mockResolvedValue(false);

      const request = createRequest(validLoginData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Invalid credentials' });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
    });

    it('successfully logs in without TOTP', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: '1',
        username: 'testuser',
        password: 'hashedpassword',
        totpEnabled: false,
      } as any);
      vi.mocked(bcrypt.compare as any).mockResolvedValue(true);
      vi.mocked(createSession).mockResolvedValue('session-token-123');
      vi.mocked(settingsCache.get).mockReturnValue({ sessionDurationHours: 24 });

      const request = createRequest(validLoginData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true, username: 'testuser' });
      expect(createSession).toHaveBeenCalledWith('1', 24);

      const cookies = response.cookies.getAll();
      expect(cookies.some(c => c.name === 'auth-token' && c.value === 'session-token-123')).toBe(true);
    });
  });

  describe('TOTP Authentication', () => {
    const mockUserWithTOTP = {
      id: '1',
      username: 'testuser_totp',
      password: 'hashedpassword',
      totpEnabled: true,
      totpVerified: true,
      totpSecret: 'secret123',
    };

    it('returns 202 if TOTP is required but not provided', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithTOTP as any);
      vi.mocked(bcrypt.compare as any).mockResolvedValue(true);

      const request = createRequest({ username: 'testuser_totp', password: 'password123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data).toEqual({ requireTOTP: true, message: 'Two-factor authentication required' });
    });

    it('returns 401 for invalid TOTP code', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithTOTP as any);
      vi.mocked(bcrypt.compare as any).mockResolvedValue(true);

      const mockValidate = vi.fn().mockReturnValue(null); // null means invalid
      vi.mocked(OTPAuth.TOTP).mockImplementation(function() { return { validate: mockValidate } as unknown as OTPAuth.TOTP; });

      const request = createRequest({ username: 'testuser_totp', password: 'password123', totpToken: '123456' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Invalid authentication code' });
      expect(mockValidate).toHaveBeenCalledWith({ token: '123456', window: 1 });
    });

    it('successfully logs in with valid TOTP', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithTOTP as any);
      vi.mocked(bcrypt.compare as any).mockResolvedValue(true);

      const mockValidate = vi.fn().mockReturnValue(0); // 0 or any non-null means valid
      vi.mocked(OTPAuth.TOTP).mockImplementation(function() { return { validate: mockValidate } as unknown as OTPAuth.TOTP; });
      vi.mocked(createSession).mockResolvedValue('session-token-totp');
      vi.mocked(settingsCache.get).mockReturnValue({ sessionDurationHours: 24 });

      const request = createRequest({ username: 'testuser_totp', password: 'password123', totpToken: '123456' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true, username: 'testuser_totp' });
      expect(createSession).toHaveBeenCalledWith('1', 24);
    });
  });

  describe('Rate Limiting (Lockout)', () => {
    it('returns 429 after 5 failed attempts and resets upon successful login', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // Failed login

      // Simulate 5 failed logins
      for (let i = 0; i < 5; i++) {
        const request = createRequest({ username: 'lockoutuser', password: 'wrongpassword' }, { 'x-forwarded-for': '10.0.0.1' });
        await POST(request);
      }

      // 6th attempt should return 429
      const lockedRequest = createRequest({ username: 'lockoutuser', password: 'wrongpassword' }, { 'x-forwarded-for': '10.0.0.1' });
      const lockedResponse = await POST(lockedRequest);
      const lockedData = await lockedResponse.json();

      expect(lockedResponse.status).toBe(429);
      expect(lockedData.error).toContain('Account temporarily locked');

      // Note: Because the failed attempts is an in-memory Map scoped by the server process,
      // it retains state. Testing lockout successfully above.
      // Testing reset upon lockout duration expiration is tricky without mocking Date.now
      // but testing successful login resets it:

      // Create a different IP to verify we can still log in successfully
      // Then verify that successful login resets it by doing a failed login later.
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: '2',
        username: 'lockoutuser2',
        password: 'hashedpassword',
        totpEnabled: false,
      } as any);
      vi.mocked(bcrypt.compare as any).mockResolvedValue(true);
      vi.mocked(createSession).mockResolvedValue('session');
      vi.mocked(settingsCache.get).mockReturnValue({ sessionDurationHours: 24 });

      // First give it 1 fail to create the record
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      await POST(createRequest({ username: 'lockoutuser2', password: 'wrong' }, { 'x-forwarded-for': '10.0.0.2' }));

      // Now succeed
      const successResponse = await POST(createRequest({ username: 'lockoutuser2', password: 'password123' }, { 'x-forwarded-for': '10.0.0.2' }));
      expect(successResponse.status).toBe(200);

      // Now fail again 4 times
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      for (let i = 0; i < 4; i++) {
        await POST(createRequest({ username: 'lockoutuser2', password: 'wrong' }, { 'x-forwarded-for': '10.0.0.2' }));
      }

      // If it reset on success, 4 fails is not enough to lock it out (max is 5)
      // The 5th fail attempt (total fails = 1+4 = 5 but 1 was reset) should return 401, not 429
      const notLockedResponse = await POST(createRequest({ username: 'lockoutuser2', password: 'wrong' }, { 'x-forwarded-for': '10.0.0.2' }));
      expect(notLockedResponse.status).toBe(401); // 401 because it's the 5th attempt after reset, so it fails auth but doesn't block before trying
    });
  });

  describe('Server Errors', () => {
    it('returns 500 when a generic error occurs', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('Database explosion'));

      const request = createRequest(validLoginData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Login failed');
      expect(data.details).toBe('An unexpected error occurred. Please try again later.');
    });
  });
});
