import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { newsCache } from '@/lib/cache';
import { resetLastFetchTime } from '@/lib/news';

export async function POST() {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    newsCache.delete('current_articles');
    resetLastFetchTime();
    return NextResponse.json({ success: true, message: 'News cache and fetch timer cleared' });
  } catch (error) {
    console.error('News cache clear error:', error);
    return NextResponse.json({ error: 'Failed to clear news cache' }, { status: 500 });
  }
}
