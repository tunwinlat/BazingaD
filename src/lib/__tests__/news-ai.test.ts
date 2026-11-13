import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Settings } from '@prisma/client';
import { fetchAndProcessFeeds } from '../news';
import { requestAIText } from '../ai';
import { prisma } from '../prisma';

const { parseURL } = vi.hoisted(() => ({ parseURL: vi.fn() }));
vi.mock('rss-parser', () => ({ default: class { parseURL = parseURL; } }));
vi.mock('../ai', () => ({ requestAIText: vi.fn() }));
vi.mock('../prisma', () => ({ prisma: {
  settings: { findFirst: vi.fn() }, newsFeed: { findMany: vi.fn() }, newsTopic: { findMany: vi.fn() },
  newsArticle: { findMany: vi.fn(), create: vi.fn() },
} }));

let testIndex = 0;
const settings = {
  newsEnabled: true, newsApiKey: 'saved-key', newsApiEndpoint: 'https://proxy.test/v1',
  newsApiModel: 'saved-model', newsApiFormat: 'openai', newsCheckIntervalMinutes: 60,
  newsMaxArticleAgeHours: 24, newsUnreadRetentionHours: 24,
} as Settings;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(Date.UTC(2026, 10, 13, 7, testIndex++)));
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(prisma.settings.findFirst).mockResolvedValue(settings);
  vi.mocked(prisma.newsFeed.findMany).mockResolvedValue([{ id: 'feed', name: 'Example', url: 'https://feed.test/rss' }] as never);
  vi.mocked(prisma.newsTopic.findMany).mockResolvedValue([]);
  vi.mocked(prisma.newsArticle.findMany).mockResolvedValue([]);
  parseURL.mockResolvedValue({ items: [{ title: 'Example news story', link: 'https://feed.test/article', pubDate: new Date().toISOString(), contentSnippet: 'Article content' }] });
  vi.mocked(requestAIText).mockResolvedValue('<think>Reasoning to discard</think>\nTITLE: A factual headline\nSUMMARY: A concise summary.');
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('configured AI in news processing', () => {
  it.each([
    ['https://proxy.test/v1', 'openai'],
    ['https://proxy.test/v1/messages', 'auto'],
    ['http://localhost:8080', 'anthropic'],
  ])('uses stored endpoint and format %s (%s)', async (endpoint, apiFormat) => {
    vi.mocked(prisma.settings.findFirst).mockResolvedValue({ ...settings, newsApiEndpoint: endpoint, newsApiFormat: apiFormat });
    expect(await fetchAndProcessFeeds()).toEqual({ fetched: 1, newArticles: 1, errors: 0 });
    expect(requestAIText).toHaveBeenCalledWith(expect.stringContaining('Article content'), {
      endpoint, apiFormat, apiKey: 'saved-key', model: 'saved-model',
    });
    expect(prisma.newsArticle.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      aiTitle: 'A factual headline', summary: 'A concise summary.', originalTitle: 'Example news story',
    }) });
  });

  it('does not store an article when the provider request fails', async () => {
    vi.mocked(requestAIText).mockRejectedValueOnce(new Error('AI request failed with status 401'));
    expect(await fetchAndProcessFeeds()).toEqual({ fetched: 1, newArticles: 0, errors: 1 });
    expect(prisma.newsArticle.create).not.toHaveBeenCalled();
  });

  it.each([false, true])('does not call AI when news is disabled or key is missing (%s)', async enabled => {
    vi.mocked(prisma.settings.findFirst).mockResolvedValue({ ...settings, newsEnabled: enabled, newsApiKey: enabled ? null : 'saved-key' });
    expect(await fetchAndProcessFeeds()).toEqual({ fetched: 0, newArticles: 0, errors: 0 });
    expect(requestAIText).not.toHaveBeenCalled();
  });
});
