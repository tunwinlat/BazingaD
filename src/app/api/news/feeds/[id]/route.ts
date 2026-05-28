import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { canDisableDefaultFeeds } from '@/lib/news';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const feed = await prisma.newsFeed.findUnique({ where: { id } });
    if (!feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    if (body.isEnabled === false && feed.isDefault) {
      const canDisable = await canDisableDefaultFeeds();
      if (!canDisable) {
        return NextResponse.json(
          { error: 'Cannot disable the last default feed without adding custom feeds first' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.newsFeed.update({
      where: { id },
      data: { isEnabled: body.isEnabled },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('News feed update error:', error);
    return NextResponse.json({ error: 'Failed to update news feed' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const feed = await prisma.newsFeed.findUnique({ where: { id } });
    if (!feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    if (feed.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default feeds' }, { status: 400 });
    }

    await prisma.newsFeed.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('News feed delete error:', error);
    return NextResponse.json({ error: 'Failed to delete news feed' }, { status: 500 });
  }
}
