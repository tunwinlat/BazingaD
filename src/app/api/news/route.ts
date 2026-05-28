import { NextResponse } from 'next/server';
import { getCurrentArticles, fetchAndProcessFeeds, cleanupExpiredArticles, shouldFetchFeeds, recordFetchTime } from '@/lib/news';
import { prisma } from '@/lib/prisma';
import { newsCache } from '@/lib/cache';

export async function GET() {
  try {
    // Trigger background fetch if needed
    const settings = await prisma.settings.findFirst();
    if (settings?.newsEnabled && settings?.newsApiKey) {
      const interval = settings.newsCheckIntervalMinutes ?? 60;
      if (shouldFetchFeeds(interval)) {
        recordFetchTime();
        // Run in background without awaiting
        Promise.resolve().then(async () => {
          try {
            await cleanupExpiredArticles();
            await fetchAndProcessFeeds();
          } catch (err) {
            console.error('Background news fetch error:', err);
          }
        });
      }
    }

    const cached = newsCache.get<ReturnType<typeof getCurrentArticles>>('current_articles');
    if (cached) {
      const articles = await cached;
      return NextResponse.json(articles);
    }

    const promise = getCurrentArticles();
    newsCache.set('current_articles', promise, 60);
    const articles = await promise;
    return NextResponse.json(articles);
  } catch (error) {
    console.error('News fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
