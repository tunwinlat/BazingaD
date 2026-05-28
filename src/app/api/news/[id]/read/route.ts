import { NextResponse } from 'next/server';
import { markArticleAsRead } from '@/lib/news';
import { newsCache } from '@/lib/cache';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await markArticleAsRead(id);
    newsCache.delete('current_articles');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Failed to mark article as read' }, { status: 500 });
  }
}
