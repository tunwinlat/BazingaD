import { prisma } from './prisma';
import Parser from 'rss-parser';
import { newsCache } from './cache';

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

export function resetLastFetchTime(): void {
  lastFetchTime = 0;
}

function safeToLower(str: string | undefined): string {
  return (str ?? '').toLowerCase().trim();
}

function normalizeUrl(url: string | undefined): string {
  if (!url) return '';
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

function normalizeTitle(title: string | undefined): string {
  return (title ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateContentHash(url: string | undefined, title: string | undefined): string {
  const normalized = normalizeUrl(url) + '|' + normalizeTitle(title);
  // Use a slightly more robust hash
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
    hash = hash & 0xffffffff;
  }
  return `hash_${hash}_${normalized.length}`;
}

// ─── Semantic Deduplication ────────────────────────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'us', 'our',
  'i', 'me', 'my', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
  'new', 'more', 'most', 'some', 'many', 'much', 'very', 'just', 'only', 'also', 'even',
  'about', 'up', 'out', 'over', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'between', 'among', 'within', 'without', 'against', 'under', 'around', 'near',
  'not', 'no', 'yes', 'so', 'too', 'can', 'than', 'then', 'now', 'here', 'there',
  'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'other', 'such',
  'what', 'which', 'who', 'whom', 'whose',
  // Common news verbs (low semantic value for story identity)
  'releases', 'release', 'released', 'launches', 'launch', 'launched',
  'announces', 'announce', 'announced', 'unveils', 'unveil', 'unveiled',
  'introduces', 'introduce', 'introduced', 'says', 'say', 'said',
  'report', 'reports', 'reported', 'claims', 'claim', 'claimed',
  'confirms', 'confirm', 'confirmed', 'reveals', 'reveal', 'revealed',
  'updates', 'update', 'updated', 'upgrade', 'upgrades', 'upgraded',
]);

/** Simple suffix-stripping stemmer for normalizing related words */
function simpleStem(word: string): string {
  if (word.length <= 3) return word;
  const suffixes = [
    { s: 'fully', min: 7 },   // successfully → success
    { s: 'ingly', min: 7 },
    { s: 'edly', min: 6 },
    { s: 'ally', min: 6 },    // usually → usual
    { s: 'able', min: 6 },    // comfortable → comfort
    { s: 'ible', min: 6 },
    { s: 'ment', min: 6 },    // development → develop
    { s: 'ness', min: 6 },
    { s: 'tion', min: 6 },    // creation → crea
    { s: 'sion', min: 6 },    // mission → miss
    { s: 'ing', min: 5 },     // running → run
    { s: 'est', min: 5 },     // fastest → fast
    { s: 'ly', min: 4 },      // quickly → quick
    { s: 'al', min: 6 },      // orbital → orbit (protects "final" → stays)
    { s: 'er', min: 4 },      // bigger → big
    { s: 'ed', min: 4 },      // walked → walk
    { s: 'es', min: 4 },      // reaches → reach
  ];
  for (const { s, min } of suffixes) {
    if (word.length >= min && word.endsWith(s)) {
      return word.slice(0, -s.length);
    }
  }
  // Strip trailing 's' for plurals, but protect words ending in 'ss', 'us', 'is'
  if (word.length >= 4 && word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us') && !word.endsWith('is')) {
    return word.slice(0, -1);
  }
  return word;
}

/** Pairs of contradictory action words — if both appear, they're different stories */
const CONTRADICTORY_PAIRS: [string, string][] = [
  ['raise', 'cut'], ['raises', 'cuts'], ['raised', 'cut'],
  ['up', 'down'], ['gain', 'loss'], ['gains', 'losses'],
  ['buy', 'sell'], ['bull', 'bear'],
  ['approve', 'reject'], ['pass', 'fail'],
  ['hire', 'fire'], ['hires', 'fires'],
  ['increase', 'decrease'], ['grow', 'shrink'],
  ['win', 'lose'], ['wins', 'loses'],
  ['accept', 'deny'], ['allow', 'block'],
  ['expand', 'shrink'], ['rise', 'fall'], ['rises', 'falls'],
  ['drop', 'surge'], ['drops', 'surges'],
  ['add', 'remove'], ['adds', 'removes'],
  ['enable', 'disable'],
  ['start', 'stop'], ['begin', 'end'],
  ['join', 'leave'], ['enter', 'exit'],
  ['open', 'close'],
  ['success', 'failure'],
  ['positive', 'negative'],
  ['higher', 'lower'],
  ['strong', 'weak'],
];

/** Check if two titles contain contradictory action words (e.g. "raises" vs "cuts") */
function hasContradictoryWords(title1: string, title2: string): boolean {
  const w1 = title1.toLowerCase().split(/[^a-z]+/);
  const w2 = title2.toLowerCase().split(/[^a-z]+/);
  for (const [a, b] of CONTRADICTORY_PAIRS) {
    const hasA = w1.includes(a) && w2.includes(b);
    const hasB = w1.includes(b) && w2.includes(a);
    if (hasA || hasB) return true;
  }
  return false;
}

/** Extract story-identifying tokens from a title */
export function extractStorySignature(title: string): string[] {
  const normalized = title.toLowerCase();
  const anchors: string[] = [];

  // Numbers (versions like 4.8 and plain numbers like 5, 120, 2024)
  const numbers = [...normalized.matchAll(/\b\d+(?:\.\d+)*\b/g)].map(m => m[0]);
  for (const n of numbers) {
    const key = `n:${n}`;
    if (!anchors.includes(key)) anchors.push(key);
  }

  // Stemmed significant words 3+ chars
  const words = normalized.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
  for (const word of words) {
    if (word.length < 3 || STOP_WORDS.has(word) || /^\d+$/.test(word)) continue;
    const stemmed = simpleStem(word);
    const key = `w:${stemmed}`;
    if (!anchors.includes(key)) anchors.push(key);
  }

  return anchors.sort();
}

/** Jaccard similarity between two story signatures */
export function calculateStorySimilarity(sig1: string[], sig2: string[]): number {
  const set1 = new Set(sig1);
  const set2 = new Set(sig2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

/** Count how many anchor tokens two signatures share */
export function countSharedAnchors(sig1: string[], sig2: string[]): number {
  const set1 = new Set(sig1);
  const set2 = new Set(sig2);
  return [...set1].filter(a => set2.has(a)).length;
}

/** Decide if two articles are about the same story */
export function isSimilarStory(title1: string, sig1: string[], title2: string, sig2: string[]): boolean {
  if (hasContradictoryWords(title1, title2)) return false;
  const similarity = calculateStorySimilarity(sig1, sig2);
  const shared = countSharedAnchors(sig1, sig2);
  return (similarity >= 0.30 && shared >= 3) || shared >= 5;
}

interface RecentArticleSig {
  originalTitle: string;
  aiTitle: string | null;
  signature: string[];
}

/** Fetch recent articles and pre-compute their story signatures */
async function fetchRecentArticleSignatures(windowHours: number): Promise<RecentArticleSig[]> {
  const now = new Date();
  const since = new Date(now.getTime() - windowHours * 60 * 60 * 1000);

  const articles = await prisma.newsArticle.findMany({
    where: {
      publishedAt: { gte: since },
      expiresAt: { gt: now },
    },
    select: { originalTitle: true, aiTitle: true },
  });

  return articles.map(a => ({
    originalTitle: a.originalTitle,
    aiTitle: a.aiTitle,
    signature: extractStorySignature(a.aiTitle || a.originalTitle),
  }));
}

function parseRssDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date();
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    // Try to handle some non-standard formats
    // Some feeds use GMT instead of UTC, or have extra whitespace
    const cleaned = dateStr
      .replace(/^\s+|\s+$/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^(\w+,?\s+\d{1,2}\s+\w+\s+\d{4}\s+\d{1,2}:\d{2}:\d{2})\s*(GMT|UTC|EST|CST|MST|PST)$/i, '$1 $2');
    const retry = new Date(cleaned);
    if (!isNaN(retry.getTime())) return retry;
    console.warn(`[news] Could not parse RSS date: "${dateStr}", using current time`);
    return new Date();
  }
  return parsed;
}

function extractItemLink(item: Parser.Item): string | undefined {
  return item.link ?? (item as Record<string, unknown>).guid as string | undefined ?? undefined;
}

function cleanAIResponse(raw: string): string {
  if (!raw) return '';
  // For reasoning models, the actual response usually comes after the last </think>
  if (raw.includes('</think>')) {
    const idx = raw.lastIndexOf('</think>');
    const after = raw.slice(idx + 8).trim();
    if (after.length > 5) return after;
  }
  // Remove any complete or stray think tags
  return raw.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>/g, '').replace(/<\/think>/g, '').trim();
}

function isGarbageTitle(title: string): boolean {
  const garbagePatterns = [
    /^\d+\s*words?\s*[✓√]?$/i,
    /max\s*\d+\s*words?/i,
    /clear,?\s*factual/i,
    /non-clickbait/i,
    /sentences?\s*[-–]\s*factual/i,
    /option\s*\d/i,
    /format\s*must\s*be/i,
    /title\s*options?/i,
    /let\s*me\s*(craft|write|think)/i,
    /^\s*[✓√]\s*$/i,
  ];
  return garbagePatterns.some(p => p.test(title)) || title.length < 3;
}

function isGarbageSummary(summary: string): boolean {
  const garbagePatterns = [
    /format\s*must\s*be\s*exact/i,
    /title\s*options?/i,
    /let\s*me\s*(craft|write|think)/i,
    /summary\s*needs?\s*to\s*cover/i,
    /i['']ll\s*go\s*with/i,
    /^\s*-\s*the\s+/im,
    /article\s*title:/i,
    /content:/i,
  ];
  return garbagePatterns.some(p => p.test(summary));
}

async function summarizeWithAI(title: string, content: string, apiKey: string): Promise<{ aiTitle: string; summary: string }> {
  await aiRateLimiter.acquire();

  const prompt = `You are a helpful news assistant. Given an article title and content excerpt, create:
1. A clear, factual, non-clickbait title (maximum 10 words)
2. A concise 2-3 sentence summary

CRITICAL: Respond ONLY in this exact format. Do not include any reasoning, explanations, thinking, or additional text:
TITLE: <your title here>
SUMMARY: <your summary here>

Article Title: ${title}
Content: ${content.slice(0, 3000)}`;

  const response = await fetch('https://api.minimax.io/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'MiniMax-M2.7',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI API error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || data.content?.[0]?.text || '';

  const cleaned = cleanAIResponse(rawContent);

  const titleMatch = cleaned.match(/^TITLE:\s*(.+?)$/im);
  const summaryMatch = cleaned.match(/^SUMMARY:\s*([\s\S]+?)(?=\n[A-Z]+:|$)/im);

  let aiTitle = titleMatch?.[1]?.trim() || '';
  let summary = summaryMatch?.[1]?.trim() || '';

  // Fallback to original title if AI title is garbage or missing
  if (!aiTitle || isGarbageTitle(aiTitle)) {
    aiTitle = title;
  }

  // Clear summary if it's garbage
  if (!summary || isGarbageSummary(summary)) {
    summary = '';
  }

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
  const checkIntervalMinutes = settings.newsCheckIntervalMinutes ?? 60;
  const maxAgeHours = settings.newsMaxArticleAgeHours ?? 24;
  // Fetch window based on check interval + 10 min buffer, capped at max article age
  const fetchWindowMinutes = Math.min(checkIntervalMinutes + 10, maxAgeHours * 60);
  const cutoffTime = new Date(now.getTime() - fetchWindowMinutes * 60 * 1000);

  // ─── Deduplication setup ─────────────────────────────────────────
  // 1. Exact hash dedup (fast, catches same-URL reposts)
  const existingArticles = await prisma.newsArticle.findMany({
    where: { expiresAt: { gt: now } },
    select: { contentHash: true },
  });
  const existingHashes = new Set(existingArticles.map(a => a.contentHash));

  // 2. Semantic dedup: pre-compute signatures for recent articles
  const recentSigs = await fetchRecentArticleSignatures(6); // 6-hour lookback

  let fetchedCount = 0;
  let newCount = 0;
  let errorCount = 0;
  let skippedOld = 0;
  let skippedExactDup = 0;
  let skippedSemanticDup = 0;
  let skippedTopic = 0;
  const articlesToSummarize: { title: string; content: string; url: string; feedId: string; publishedAt: Date; hash: string }[] = [];
  const batchSigs: { title: string; signature: string[] }[] = []; // Accepted articles in this batch

  for (const feed of feeds) {
    try {
      const rss = await rssParser.parseURL(feed.url);
      fetchedCount++;

      for (const item of rss.items.slice(0, 20)) { // Max 20 per feed
        const link = extractItemLink(item);
        if (!item.title || !link) {
          continue;
        }

        const pubDate = parseRssDate(item.pubDate);
        // Skip articles older than the configured max age (default 24h)
        if (pubDate < cutoffTime) {
          skippedOld++;
          continue;
        }

        // ── Exact duplicate check ──
        const hash = generateContentHash(link, item.title);
        if (existingHashes.has(hash)) {
          skippedExactDup++;
          continue;
        }

        const content = item.contentSnippet || item.content || item.title;

        // Topic filtering
        if (topics.length > 0) {
          const textToCheck = (item.title + ' ' + content).toLowerCase();
          const matchesTopic = topics.some(t => textToCheck.includes(t.phrase.toLowerCase()));
          if (!matchesTopic) {
            skippedTopic++;
            continue;
          }
        }

        // ── Semantic duplicate check ──
        const newSig = extractStorySignature(item.title);
        let isSemanticDup = false;

        // Check against existing recent articles
        for (const recent of recentSigs) {
          if (isSimilarStory(item.title, newSig, recent.aiTitle || recent.originalTitle, recent.signature)) {
            isSemanticDup = true;
            break;
          }
        }
        if (isSemanticDup) {
          skippedSemanticDup++;
          continue;
        }

        // Check against other articles in this batch
        for (const batch of batchSigs) {
          if (isSimilarStory(item.title, newSig, batch.title, batch.signature)) {
            isSemanticDup = true;
            break;
          }
        }
        if (isSemanticDup) {
          skippedSemanticDup++;
          continue;
        }

        articlesToSummarize.push({
          title: item.title,
          content,
          url: link,
          feedId: feed.id,
          publishedAt: pubDate,
          hash,
        });
        existingHashes.add(hash); // Prevent exact duplicates within this batch
        batchSigs.push({ title: item.title, signature: newSig }); // Prevent semantic duplicates within this batch
      }
    } catch (error) {
      console.error(`[news] Failed to fetch feed ${feed.name}:`, error);
      errorCount++;
    }
  }

  console.log(`[news] Feed scan complete: ${fetchedCount} feeds fetched, ${articlesToSummarize.length} articles to summarize (${skippedOld} old, ${skippedExactDup} exact-dup, ${skippedSemanticDup} semantic-dup, ${skippedTopic} topic-mismatched)`);

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
      console.error('[news] Failed to save article:', error);
      errorCount++;
    }
  }

  // Clear the news cache so subsequent requests pick up the new articles immediately
  if (newCount > 0) {
    newsCache.delete('current_articles');
    console.log(`[news] Saved ${newCount} new articles, cleared cache`);
  }

  return { fetched: fetchedCount, newArticles: newCount, errors: errorCount };
}

export async function cleanupExpiredArticles(): Promise<number> {
  const now = new Date();
  const result = await prisma.newsArticle.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  if (result.count > 0) {
    console.log(`[news] Cleaned up ${result.count} expired articles`);
  }
  return result.count;
}

export async function cleanupGarbageArticles(): Promise<number> {
  const articles = await prisma.newsArticle.findMany({
    where: { aiTitle: { not: null } },
    select: { id: true, aiTitle: true, summary: true },
  });

  const idsToDelete: string[] = [];
  for (const article of articles) {
    const title = article.aiTitle || '';
    const summary = article.summary || '';
    if (isGarbageTitle(title) || summary.includes('</think>') || isGarbageSummary(summary)) {
      idsToDelete.push(article.id);
    }
  }

  if (idsToDelete.length > 0) {
    await prisma.newsArticle.deleteMany({
      where: { id: { in: idsToDelete } },
    });
    console.log(`[news] Cleaned up ${idsToDelete.length} garbage articles`);
  }

  return idsToDelete.length;
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
    maxArticleAgeHours: settings?.newsMaxArticleAgeHours ?? 24,
  };
}

export async function canDisableDefaultFeeds(): Promise<boolean> {
  const customFeedCount = await prisma.newsFeed.count({
    where: { isDefault: false, isEnabled: true },
  });
  return customFeedCount > 0;
}
