import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const blocks = await prisma.block.findMany({
      orderBy: { title: 'asc' },
    });
    return NextResponse.json(blocks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch blocks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const block = await prisma.block.create({
      data: {
        title: data.title,
        url: data.url,
        description: data.description,
        icon: data.icon,
        categoryId: data.categoryId,
        serviceUrl: data.serviceUrl,
        serviceType: data.serviceType,
        healthCheckUrl: data.healthCheckUrl,
        isMonitored: data.isMonitored || false,
      },
    });
    return NextResponse.json(block);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create block' }, { status: 500 });
  }
}
