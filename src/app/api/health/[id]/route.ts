import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const block = await prisma.block.findUnique({
      where: { id },
    });

    if (!block || !block.healthCheckUrl) {
      return NextResponse.json({ error: 'Block not found or no health check URL' }, { status: 404 });
    }

    const startTime = Date.now();
    let status = 'offline';
    let error = null;

    try {
      const response = await fetch(block.healthCheckUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });
      status = response.ok ? 'online' : 'offline';
    } catch (e) {
      status = 'offline';
      error = e instanceof Error ? e.message : 'Unknown error';
    }

    const responseTime = Date.now() - startTime;

    await prisma.block.update({
      where: { id },
      data: {
        lastStatus: status,
        lastCheckedAt: new Date(),
      },
    });

    return NextResponse.json({
      status,
      responseTime,
      error,
      lastChecked: new Date(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check health' }, { status: 500 });
  }
}
