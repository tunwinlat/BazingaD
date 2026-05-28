import { prisma } from './prisma';
import Parser from 'rss-parser';

const rssParser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; StartPageBot/1.0)',
  },
});

// Rate limiter for AI summarization: 1 request per 5 seconds
class RateLimiter {
  private lastRequestTime = 0;
  private queue: (() => void)[] = [];
  private readonly minInterval: number;

  constructor(intervalMs: number) {
    this.minInterval = intervalMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const timeSinceLast = now - this.lastRequestTime;
    const waitTime = Math.max(0, this.minInterval - timeSinceLast);

    if (waitTime > 0) {
      await new Promise<void>(resolve => {
        this.queue.push(resolve);
        setTimeout(() => {
          const fn = this.queue.shift();
          if (fn) fn();
        }, waitTime);
      });
    }

    this.lastRequestTime = Date.now();
  }
}

const aiRateLimiter = new RateLimiter(5000); // 5 seconds

// Track last fetch time to avoid running too frequently
let lastFetchTime = 0;

export function shouldFetchFeeds(intervalMinutes: number): boolean {
  const now = Date.now();
  const intervalMs = intervalMinutes * 60 * 1000;
  return now - lastFetchTime > intervalMs;
}

export function recordFetchTime(): void {
  lastFetchTime = Date.now();
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove common tracking params
    u.searchParams.delete('utm_source');
    u.searchParams.delete('utm_medium');
    u.searchParams.delete('utm_campaign');
    u.searchParams.delete('utm_content');
    u.searchParams.delete('utm_term');
    u.searchParams.delete('ref');
    return u.toString().toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateContentHash(url: string, title: string): string {
  const normalized = normalizeUrl(url) + '|' + normalizeTitle(title);
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash)}_${normalized.length}`;
}

async function summarizeWithAI(title: string, content: string, apiKey: string): Promise<{ aiTitle: string; summary: string }> {
  await aiRateLimiter.acquire();

  const prompt = `You are a helpful news assistant. Given an article title and content excerpt, create:
1. A clear, factual, non-clickbait title (max 10 words)
2. A concise 2-3 sentence summary

Respond ONLY in this exact format:
TITLE: <your title here>
SUMMARY: <your summary here>

Article Title: ${title}
Content: ${content.slice(0, 3000)}`;

  const response = await fetch('https://api.minimax.io/anthropic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'MiniMax-M2.7',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI API error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || data.content?.[0]?.text || '';

  const titleMatch = rawContent.match(/TITLE:\s*(.+?)(?:\n|$)/i);
  const summaryMatch = rawContent.match(/SUMMARY:\s*([\s\S]+?)(?=\n[A-Z]+:|$)/i);

  const aiTitle = titleMatch?.[1]?.trim() || title;
  const summary = summaryMatch?.[1]?.trim() || '';

  return { aiTitle, summary };
}

export async function fetchAndProcessFeeds(): Promise<{ fetched: number; newArticles: number; errors: number }> {
  const settings = await prisma.settings.findFirst();
  if (!settings?.newsEnabled || !settings.newsApiKey) {
    return { fetched: 0, newArticles: 0, errors: 0 };
  }

  const feeds = await prisma.newsFeed.findMany({ where: { isEnabled: true } });
  if (feeds.length === 0) {
    return { fetched: 0, newArticles: 0, errors: 0 };
  }

  const topics = await prisma.newsTopic.findMany();
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Get existing hashes to deduplicate
  const existingArticles = await prisma.newsArticle.findMany({
    where: { expiresAt: { gt: now } },
    select: { contentHash: true },
  });
  const existingHashes = new Set(existingArticles.map(a => a.contentHash));

  let fetchedCount = 0;
  let newCount = 0;
  let errorCount = 0;
  const articlesToSummarize: { title: string; content: string; url: string; feedId: string; publishedAt: Date; hash: string }[] = [];

  for (const feed of feeds) {
    try {
      const rss = await rssParser.parseURL(feed.url);
      fetchedCount++;

      for (const item of rss.items.slice(0, 20)) { // Max 20 per feed
        if (!item.title || !item.link) continue;

        const pubDate = item.pubDate ? new Date(item.pubDate) : now;
        // Skip articles older than 1 hour (we only want recent news)
        if (pubDate < oneHourAgo) continue;

        const hash = generateContentHash(item.link, item.title);
        if (existingHashes.has(hash)) continue;

        const content = item.contentSnippet || item.content || item.title;

        // Topic filtering
        if (topics.length > 0) {
          const textToCheck = (item.title + ' ' + content).toLowerCase();
          const matchesTopic = topics.some(t => textToCheck.includes(t.phrase.toLowerCase()));
          if (!matchesTopic) continue;
        }

        articlesToSummarize.push({
          title: item.title,
          content,
          url: item.link,
          feedId: feed.id,
          publishedAt: pubDate,
          hash,
        });
        existingHashes.add(hash); // Prevent duplicates within this batch
      }
    } catch (error) {
      console.error(`Failed to fetch feed ${feed.name}:`, error);
      errorCount++;
    }
  }

  // Summarize articles with AI (rate limited)
  for (const article of articlesToSummarize) {
    try {
      const { aiTitle, summary } = await summarizeWithAI(article.title, article.content, settings.newsApiKey!);

      const expiresAt = new Date(
        article.publishedAt.getTime() + settings.newsUnreadRetentionHours * 60 * 60 * 1000
      );

      await prisma.newsArticle.create({
        data: {
          originalTitle: article.title,
          aiTitle,
          summary,
          url: article.url,
          sourceFeedId: article.feedId,
          publishedAt: article.publishedAt,
          expiresAt,
          contentHash: article.hash,
        },
      });
      newCount++;
    } catch (error) {
      console.error('Failed to summarize article:', error);
      errorCount++;
    }
  }

  return { fetched: fetchedCount, newArticles: newCount, errors: errorCount };
}

export async function cleanupExpiredArticles(): Promise<number> {
  const now = new Date();
  const result = await prisma.newsArticle.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  return result.count;
}

export async function markArticleAsRead(articleId: string): Promise<void> {
  const settings = await prisma.settings.findFirst();
  const article = await prisma.newsArticle.findUnique({ where: { id: articleId } });
  if (!article) return;

  const readRetentionHours = settings?.newsReadRetentionHours ?? 8;
  const newExpiresAt = new Date(
    article.publishedAt.getTime() + readRetentionHours * 60 * 60 * 1000
  );

  await prisma.newsArticle.update({
    where: { id: articleId },
    data: {
      isRead: true,
      readAt: new Date(),
      expiresAt: newExpiresAt,
    },
  });
}

export async function getCurrentArticles(): Promise<
  Array<{
    id: string;
    originalTitle: string;
    aiTitle: string | null;
    summary: string | null;
    url: string;
    isRead: boolean;
    publishedAt: Date;
    sourceFeed: { name: string };
  }>
> {
  const now = new Date();
  return prisma.newsArticle.findMany({
    where: { expiresAt: { gt: now } },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      originalTitle: true,
      aiTitle: true,
      summary: true,
      url: true,
      isRead: true,
      publishedAt: true,
      sourceFeed: { select: { name: true } },
    },
  });
}

export async function getNewsSettings() {
  const settings = await prisma.settings.findFirst();
  return {
    enabled: settings?.newsEnabled ?? false,
    apiKey: settings?.newsApiKey ?? null,
    checkIntervalMinutes: settings?.newsCheckIntervalMinutes ?? 60,
    unreadRetentionHours: settings?.newsUnreadRetentionHours ?? 24,
    readRetentionHours: settings?.newsReadRetentionHours ?? 8,
  };
}

export async function canDisableDefaultFeeds(): Promise<boolean> {
  const customFeedCount = await prisma.newsFeed.count({
    where: { isDefault: false, isEnabled: true },
  });
  return customFeedCount > 0;
}
