import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { categoriesCache } from '@/lib/cache';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    block: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn(),
}));

vi.mock('@/lib/cache', () => ({
  categoriesCache: {
    delete: vi.fn(),
  },
}));

// Mock safeParse from validation
vi.mock('@/lib/validation', () => ({
  blockCreateSchema: {
    safeParse: vi.fn((body) => {
      if (!body.title || !body.url || !body.categoryId) {
        return { success: false, error: { errors: [{ message: 'Missing fields' }] } };
      }
      if (body.url.includes('localhost')) {
        return { success: false, error: { errors: [{ message: 'URL is not allowed for security reasons' }] } };
      }
      return { success: true, data: body };
    }),
  },
}));

describe('Blocks API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/blocks', () => {
    it('returns blocks successfully', async () => {
      const mockBlocks = [
        { id: '1', title: 'Block 1', sortOrder: 0 },
        { id: '2', title: 'Block 2', sortOrder: 1 },
      ];
      vi.mocked(prisma.block.findMany).mockResolvedValue(mockBlocks as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockBlocks);
      expect(response.headers.get('Cache-Control')).toBe('private, max-age=60');
      expect(prisma.block.findMany).toHaveBeenCalledWith({
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('handles database errors gracefully', async () => {
      vi.mocked(prisma.block.findMany).mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch blocks' });
    });
  });

  describe('POST /api/blocks', () => {
    const validBlockData = {
      title: 'New Block',
      url: 'https://example.com',
      categoryId: 'cat_123',
    };

    it('returns 401 when unauthorized', async () => {
      vi.mocked(verifyAuth).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/blocks', {
        method: 'POST',
        body: JSON.stringify(validBlockData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
      expect(prisma.block.create).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid data', async () => {
      vi.mocked(verifyAuth).mockResolvedValue({ userId: 'user_1', sessionToken: 'token' });

      const request = new Request('http://localhost:3000/api/blocks', {
        method: 'POST',
        body: JSON.stringify({ title: 'Missing URL and Category' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined(); // Zod validation message
      expect(prisma.block.create).not.toHaveBeenCalled();
    });

    it('returns 400 for malicious URL', async () => {
      vi.mocked(verifyAuth).mockResolvedValue({ userId: 'user_1', sessionToken: 'token' });

      const request = new Request('http://localhost:3000/api/blocks', {
        method: 'POST',
        body: JSON.stringify({
          ...validBlockData,
          url: 'http://localhost:8080/admin'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(prisma.block.create).not.toHaveBeenCalled();
    });

    it('creates a block successfully', async () => {
      vi.mocked(verifyAuth).mockResolvedValue({ userId: 'user_1', sessionToken: 'token' });

      const mockCreatedBlock = { id: 'block_1', ...validBlockData, sortOrder: 0 };
      vi.mocked(prisma.block.create).mockResolvedValue(mockCreatedBlock as any);

      const request = new Request('http://localhost:3000/api/blocks', {
        method: 'POST',
        body: JSON.stringify(validBlockData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockCreatedBlock);
      expect(prisma.block.create).toHaveBeenCalledWith({
        data: expect.objectContaining(validBlockData),
      });
      expect(categoriesCache.delete).toHaveBeenCalledWith('categories_with_blocks');
    });

    it('handles database errors during creation', async () => {
      vi.mocked(verifyAuth).mockResolvedValue({ userId: 'user_1', sessionToken: 'token' });
      vi.mocked(prisma.block.create).mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost:3000/api/blocks', {
        method: 'POST',
        body: JSON.stringify(validBlockData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to create block' });
    });
  });
});
