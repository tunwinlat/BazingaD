import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { blocks: true },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const category = await prisma.category.create({
      data: {
        name: data.name,
        icon: data.icon || 'default',
        sortOrder: data.sortOrder || 0,
      },
    });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
