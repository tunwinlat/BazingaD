import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.newsTopic.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('News topic delete error:', error);
    return NextResponse.json({ error: 'Failed to delete news topic' }, { status: 500 });
  }
}
