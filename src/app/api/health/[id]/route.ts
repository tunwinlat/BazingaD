import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isSafeUrl } from '@/lib/security';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const block = await prisma.block.findUnique({
      where: { id },
    });

    if (!block || !block.healthCheckUrl) {
      return NextResponse.json({ error: 'Block not found or no health check URL' }, { status: 404 });
    }

    // SSRF Protection: Validate the health check URL
    if (!isSafeUrl(block.healthCheckUrl)) {
      return NextResponse.json({ error: 'Invalid or unsafe health check URL' }, { status: 400 });
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
    } catch {
      status = 'offline';
      error = 'Health check failed';
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
  } catch {
    return NextResponse.json({ error: 'Failed to check health' }, { status: 500 });
  }
}
