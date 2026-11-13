import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestAIText } from '../ai';
import { DEFAULT_AI_ENDPOINT, DEFAULT_AI_MODEL, resolveAIEndpoint, type AIConfig } from '../ai-config';
import { newsSettingsSchema } from '../validation';

const config: AIConfig = {
  endpoint: DEFAULT_AI_ENDPOINT,
  model: DEFAULT_AI_MODEL,
  apiKey: 'test-secret',
  apiFormat: 'auto',
};

const answer = 'TITLE: A factual headline\nSUMMARY: A short news summary.';

afterEach(() => vi.unstubAllGlobals());

describe('AI endpoint resolution', () => {
  it.each([
    ['https://api.minimax.io/v1/chat/completions', 'auto', 'https://api.minimax.io/v1/chat/completions', 'openai'],
    ['https://api.openai.com', 'auto', 'https://api.openai.com/v1/chat/completions', 'openai'],
    ['https://api.openai.com/v1/', 'auto', 'https://api.openai.com/v1/chat/completions', 'openai'],
    ['http://localhost:11434/v1', 'auto', 'http://localhost:11434/v1/chat/completions', 'openai'],
    ['https://proxy.test/custom/chat/completions/?version=1', 'auto', 'https://proxy.test/custom/chat/completions?version=1', 'openai'],
    ['https://api.anthropic.com', 'auto', 'https://api.anthropic.com/v1/messages', 'anthropic'],
    ['https://api.anthropic.com/v1/', 'auto', 'https://api.anthropic.com/v1/messages', 'anthropic'],
    ['https://proxy.test/v1/messages/', 'auto', 'https://proxy.test/v1/messages', 'anthropic'],
    ['https://proxy.test/anthropic', 'auto', 'https://proxy.test/anthropic/v1/messages', 'anthropic'],
    ['https://proxy.test/anthropic/v1', 'auto', 'https://proxy.test/anthropic/v1/messages', 'anthropic'],
    ['https://proxy.test', 'anthropic', 'https://proxy.test/v1/messages', 'anthropic'],
    ['http://127.0.0.1:8080/custom/v1', 'anthropic', 'http://127.0.0.1:8080/custom/v1/messages', 'anthropic'],
    ['https://proxy.test/anthropic/v1', 'openai', 'https://proxy.test/anthropic/v1/chat/completions', 'openai'],
  ] as const)('resolves %s (%s)', (endpoint, apiFormat, url, format) => {
    expect(resolveAIEndpoint(endpoint, apiFormat)).toEqual({ url, format });
  });

  it.each([
    'not a url', 'file:///etc/passwd', 'ftp://host.test', 'javascript:alert(1)',
    'https://user:secret@host.test/v1', 'https://host.test/v1#fragment',
  ])('rejects unsafe or invalid URL %s', endpoint => {
    expect(newsSettingsSchema.safeParse({ newsApiEndpoint: endpoint }).success).toBe(false);
    expect(() => resolveAIEndpoint(endpoint)).toThrow();
  });

  it('rejects an endpoint that conflicts with the explicit API format', () => {
    expect(() => resolveAIEndpoint('https://proxy.test/v1/messages', 'openai')).toThrow('does not match');
    expect(newsSettingsSchema.safeParse({
      newsApiEndpoint: 'https://proxy.test/v1/chat/completions', newsApiFormat: 'anthropic',
    }).success).toBe(false);
  });

  it('trims fields and accepts long provider keys', () => {
    expect(newsSettingsSchema.parse({
      newsApiEndpoint: ' https://api.openai.com/v1 ', newsApiModel: ' custom-model ', newsApiKey: ' k '.repeat(300),
    })).toMatchObject({ newsApiEndpoint: 'https://api.openai.com/v1', newsApiModel: 'custom-model' });
  });

  it.each([
    { newsApiEndpoint: '' }, { newsApiModel: '   ' }, { newsApiFormat: 'unknown' }, { newsApiKey: 'k'.repeat(4097) },
  ])('rejects invalid AI settings %j', settings => {
    expect(newsSettingsSchema.safeParse(settings).success).toBe(false);
  });

  it('accepts legacy partial settings without AI fields', () => {
    expect(newsSettingsSchema.parse({ newsEnabled: true })).toEqual({ newsEnabled: true });
  });
});

describe('AI API transport', () => {
  it.each([
    [DEFAULT_AI_ENDPOINT, DEFAULT_AI_MODEL],
    ['https://api.openai.com/v1', 'custom-openai-model'],
    ['http://localhost:1234/v1', 'local-model'],
  ])('uses OpenAI-compatible auth and payload for %s', async (endpoint, model) => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: answer } }] }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await requestAIText('Summarize this', { ...config, endpoint, model })).toBe(answer);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(resolveAIEndpoint(endpoint).url);
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer test-secret' });
    expect(JSON.parse(init.body)).toEqual({ model, messages: [{ role: 'user', content: 'Summarize this' }] });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.redirect).toBe('error');
  });

  it('uses Anthropic auth, mandatory token limit, and all text blocks', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      content: [
        { type: 'thinking', thinking: 'private reasoning' },
        { type: 'text', text: 'TITLE: A factual headline' },
        { type: 'text', text: 'SUMMARY: A short news summary.' },
      ],
    }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await requestAIText('Prompt', { ...config, endpoint: 'https://gateway.test/v1/messages', model: 'custom-claude' })).toBe(answer);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://gateway.test/v1/messages');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', 'x-api-key': 'test-secret', 'anthropic-version': '2023-06-01' });
    expect(JSON.parse(init.body)).toEqual({ model: 'custom-claude', max_tokens: 1024, messages: [{ role: 'user', content: 'Prompt' }] });
  });

  it('supports an explicit Anthropic override for an ambiguous gateway base URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ content: [{ type: 'text', text: answer }] }));
    vi.stubGlobal('fetch', fetchMock);
    await requestAIText('Prompt', { ...config, endpoint: 'https://gateway.test/api', apiFormat: 'anthropic' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://gateway.test/api/v1/messages');
  });

  it.each([401, 429, 500])('reports HTTP %s without exposing response bodies', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('test-secret: sensitive provider error', { status })));
    await expect(requestAIText('Prompt', config)).rejects.toThrow(`AI request failed with status ${status}`);
  });

  it.each([
    {}, { choices: [] }, { choices: [{ message: { content: null } }] },
    { choices: [{ message: { content: '' } }] }, { choices: [{ message: { content: '   ' } }] },
  ])('rejects missing or empty OpenAI text %j', async data => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(data)));
    await expect(requestAIText('Prompt', config)).rejects.toThrow();
  });

  it('rejects Anthropic responses with no text blocks', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ content: [{ type: 'thinking' }] })));
    await expect(requestAIText('Prompt', { ...config, endpoint: 'https://api.anthropic.com' })).rejects.toThrow('did not contain text');
  });

  it('does not expose malformed JSON response snippets in errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('test-secret: not JSON')));
    await expect(requestAIText('Prompt', config)).rejects.toThrow('AI response was not valid text in the expected API format');
  });

  it('propagates network failures and timeouts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Timed out', 'TimeoutError')));
    await expect(requestAIText('Prompt', config)).rejects.toThrow('Timed out');
  });
});
