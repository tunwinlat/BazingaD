import { NextResponse } from 'next/server';
import { fetchAndProcessFeeds, cleanupExpiredArticles, cleanupGarbageArticles } from '@/lib/news';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  try {
    // Verify cron secret if configured
    const authHeader = request.headers.get('x-cron-secret');
    if (CRON_SECRET && authHeader !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clean up expired and garbage articles first
    const cleanedCount = await cleanupExpiredArticles();
    const garbageCount = await cleanupGarbageArticles();

    // Fetch and process feeds
    const result = await fetchAndProcessFeeds();

    return NextResponse.json({
      success: true,
      cleaned: cleanedCount,
      garbageCleaned: garbageCount,
      ...result,
    });
  } catch (error) {
    console.error('News job error:', error);
    return NextResponse.json({ error: 'Job failed' }, { status: 500 });
  }
}
