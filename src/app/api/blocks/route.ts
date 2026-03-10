import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { categoriesCache } from '@/lib/cache';
import { blockCreateSchema } from '@/lib/validation';

// GET /api/blocks - List all blocks
export async function GET() {
  try {
    const blocks = await prisma.block.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return NextResponse.json(blocks, {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    console.error('Failed to fetch blocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocks' },
      { status: 500 }
    );
  }
}

// POST /api/blocks - Create a new block
export async function POST(request: Request) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = blockCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const block = await prisma.block.create({
      data: validated.data,
    });

    // Invalidate categories cache since blocks are included
    categoriesCache.delete('categories_with_blocks');

    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    console.error('Failed to create block:', error);
    return NextResponse.json(
      { error: 'Failed to create block' },
      { status: 500 }
    );
  }
}
