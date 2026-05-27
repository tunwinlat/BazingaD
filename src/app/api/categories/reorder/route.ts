import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { categoriesCache } from '@/lib/cache';

const MAX_BODY_SIZE = 1024 * 1024;

// PUT /api/categories/reorder - Bulk update category sort orders
export async function PUT(request: Request) {
  try {
    // Verify authentication
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentLength = request.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
    }

    const body = await request.json();
    const { categories } = body as { categories: Array<{ id: string; sortOrder: number }> };

    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({ error: 'Invalid categories array' }, { status: 400 });
    }

    // Update all categories in a transaction
    await prisma.$transaction(
      categories.map((cat) =>
        prisma.category.update({
          where: { id: cat.id },
          data: { sortOrder: cat.sortOrder },
        })
      )
    );

    // Invalidate cache
    categoriesCache.delete('categories_with_blocks');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder categories:', error);
    return NextResponse.json(
      { error: 'Failed to reorder categories' },
      { status: 500 }
    );
  }
}
