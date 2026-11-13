import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Settings } from '@prisma/client';
import { GET, PUT } from './route';
import { verifyAuth } from '@/lib/auth';
import { newsCache } from '@/lib/cache';
import { DEFAULT_AI_ENDPOINT, DEFAULT_AI_MODEL, MASKED_API_KEY } from '@/lib/ai-config';

const { settingsDb } = vi.hoisted(() => ({
  settingsDb: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ prisma: { settings: settingsDb } }));
vi.mock('@/lib/auth', () => ({ verifyAuth: vi.fn() }));
vi.mock('@/lib/cache', () => ({ newsCache: { delete: vi.fn() } }));

const settings = {
  id: 'settings-id', newsEnabled: true, newsApiKey: 'saved-secret',
  newsApiEndpoint: DEFAULT_AI_ENDPOINT, newsApiModel: DEFAULT_AI_MODEL, newsApiFormat: 'auto',
  newsCheckIntervalMinutes: 60, newsUnreadRetentionHours: 24, newsReadRetentionHours: 8, newsMaxArticleAgeHours: 24,
} as Settings;

function put(body: unknown) {
  return PUT(new Request('http://localhost/api/news/settings', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(verifyAuth).mockResolvedValue({ userId: 'admin', sessionToken: 'token' });
  settingsDb.findFirst.mockResolvedValue(settings);
  settingsDb.update.mockImplementation(async args => ({ ...settings, ...args.data }) as Settings);
  settingsDb.create.mockImplementation(async args => ({ ...settings, ...args.data }) as Settings);
});

describe('news AI settings API', () => {
  it('returns configuration to admins without exposing the saved key', async () => {
    const body = await (await GET()).json();
    expect(body).toMatchObject({ apiKey: MASKED_API_KEY, endpoint: DEFAULT_AI_ENDPOINT, model: DEFAULT_AI_MODEL, apiFormat: 'auto' });
    expect(JSON.stringify(body)).not.toContain('saved-secret');
  });

  it('hides all private AI configuration from public callers', async () => {
    vi.mocked(verifyAuth).mockResolvedValue(null);
    expect(await (await GET()).json()).toMatchObject({ apiKey: null, endpoint: null, model: null, apiFormat: null, enabled: true });
  });

  it('returns backward-compatible defaults when no settings exist', async () => {
    settingsDb.findFirst.mockResolvedValue(null);
    expect(await (await GET()).json()).toMatchObject({ enabled: false, apiKey: null, endpoint: DEFAULT_AI_ENDPOINT, model: DEFAULT_AI_MODEL, apiFormat: 'auto' });
  });

  it('requires authentication to save settings', async () => {
    vi.mocked(verifyAuth).mockResolvedValue(null);
    expect((await put({ newsApiKey: 'new-key' })).status).toBe(401);
    expect(settingsDb.update).not.toHaveBeenCalled();
  });

  it.each([
    ['https://api.openai.com/v1', 'auto'],
    ['https://proxy.test/v1/messages', 'auto'],
    ['http://localhost:8080', 'anthropic'],
  ])('persists endpoint, model, key, and format for %s', async (endpoint, apiFormat) => {
    const response = await put({ newsApiEndpoint: endpoint, newsApiModel: 'custom-model', newsApiKey: 'new-secret', newsApiFormat: apiFormat });
    expect(response.status).toBe(200);
    expect(settingsDb.update).toHaveBeenCalledWith({ where: { id: settings.id }, data: {
      newsApiEndpoint: endpoint, newsApiModel: 'custom-model', newsApiKey: 'new-secret', newsApiFormat: apiFormat,
    } });
    const body = await response.json();
    expect(body).toMatchObject({ endpoint, model: 'custom-model', apiKey: MASKED_API_KEY, apiFormat });
    expect(JSON.stringify(body)).not.toContain('new-secret');
    expect(newsCache.delete).toHaveBeenCalledWith('current_articles');
  });

  it('preserves masked keys when saving other settings', async () => {
    await put({ newsApiKey: MASKED_API_KEY, newsApiModel: 'new-model' });
    expect(settingsDb.update).toHaveBeenCalledWith({ where: { id: settings.id }, data: { newsApiModel: 'new-model' } });
  });

  it('preserves omitted fields in legacy/partial updates', async () => {
    await put({ newsEnabled: false });
    expect(settingsDb.update).toHaveBeenCalledWith({ where: { id: settings.id }, data: { newsEnabled: false } });
  });

  it.each([null, '', '   '])('allows explicitly clearing a saved API key (%j)', async key => {
    const response = await put({ newsApiKey: key });
    expect(settingsDb.update).toHaveBeenCalledWith({ where: { id: settings.id }, data: { newsApiKey: null } });
    expect((await response.json()).apiKey).toBeNull();
  });

  it('creates settings with the new AI configuration on first save', async () => {
    settingsDb.findFirst.mockResolvedValue(null);
    await put({ newsEnabled: true, newsApiEndpoint: 'https://api.anthropic.com', newsApiModel: 'my-claude', newsApiKey: 'new-secret' });
    expect(settingsDb.create).toHaveBeenCalledWith({ data: {
      newsEnabled: true, newsApiEndpoint: 'https://api.anthropic.com', newsApiModel: 'my-claude', newsApiKey: 'new-secret',
    } });
  });

  it('does not save the mask as a key when creating settings', async () => {
    settingsDb.findFirst.mockResolvedValue(null);
    await put({ newsApiKey: MASKED_API_KEY });
    expect(settingsDb.create).toHaveBeenCalledWith({ data: {} });
  });

  it.each([
    { newsApiEndpoint: 'file:///etc/passwd' }, { newsApiModel: ' ' }, { newsApiFormat: 'unsupported' },
  ])('rejects invalid settings %j', async body => {
    const response = await put(body);
    expect(response.status).toBe(400);
    expect((await response.json()).details).toHaveLength(1);
    expect(settingsDb.update).not.toHaveBeenCalled();
  });

  it('validates format-only creation against the default endpoint', async () => {
    settingsDb.findFirst.mockResolvedValue(null);
    expect((await put({ newsApiFormat: 'anthropic' })).status).toBe(400);
    expect(settingsDb.create).not.toHaveBeenCalled();
  });

  it('validates format-only updates against the existing endpoint', async () => {
    expect((await put({ newsApiFormat: 'anthropic' })).status).toBe(400);
    expect(settingsDb.update).not.toHaveBeenCalled();
  });

  it('validates endpoint-only updates against the existing format', async () => {
    settingsDb.findFirst.mockResolvedValue({ ...settings, newsApiFormat: 'openai' });
    expect((await put({ newsApiEndpoint: 'https://proxy.test/messages' })).status).toBe(400);
    expect(settingsDb.update).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON', async () => {
    const response = await PUT(new Request('http://localhost/api/news/settings', { method: 'PUT', body: '{' }));
    expect(response.status).toBe(400);
  });
});
