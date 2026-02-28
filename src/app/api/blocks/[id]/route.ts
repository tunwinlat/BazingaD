import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const block = await prisma.block.update({
      where: { id },
      data: {
        title: data.title,
        url: data.url,
        description: data.description,
        icon: data.icon,
        categoryId: data.categoryId,
        serviceUrl: data.serviceUrl,
        serviceType: data.serviceType,
        healthCheckUrl: data.healthCheckUrl,
        isMonitored: data.isMonitored,
      },
    });
    return NextResponse.json(block);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update block' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.block.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete block' }, { status: 500 });
  }
}
