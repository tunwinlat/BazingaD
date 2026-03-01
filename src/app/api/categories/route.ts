import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { categoriesCache } from '@/lib/cache';

const CACHE_KEY = 'categories_with_blocks';

// GET /api/categories - List all categories with blocks
export async function GET() {
  try {
    // Check cache first
    const cached = categoriesCache.get<any[]>(CACHE_KEY);
    
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'private, max-age=60',
        },
      });
    }

    const categories = await prisma.category.findMany({
      include: {
        blocks: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    // Store in cache
    categoriesCache.set(CACHE_KEY, categories, 300);

    return NextResponse.json(categories, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
export async function POST(request: Request) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, icon, sortOrder } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        icon: icon || 'default',
        sortOrder: sortOrder ?? 0,
      },
      include: {
        blocks: true,
      },
    });

    // Invalidate cache
    categoriesCache.delete(CACHE_KEY);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
