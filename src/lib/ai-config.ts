export type AIFormat = 'auto' | 'openai' | 'anthropic';

export const DEFAULT_AI_ENDPOINT = 'https://api.minimax.io/v1/chat/completions';
export const DEFAULT_AI_MODEL = 'MiniMax-M3';
export const MASKED_API_KEY = '********';

export interface AIConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  apiFormat: AIFormat;
}

// Admin-configured local endpoints are allowed for self-hosted inference servers.
export function isValidAIEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.hash;
  } catch {
    return false;
  }
}

export function resolveAIEndpoint(endpoint: string, apiFormat: AIFormat = 'auto') {
  if (!isValidAIEndpoint(endpoint)) {
    throw new Error('AI endpoint must be an HTTP(S) URL without credentials or a fragment');
  }

  const url = new URL(endpoint);
  const path = url.pathname.replace(/\/+$/, '');
  const format = apiFormat === 'auto'
    ? (/\/messages$/.test(path) || url.hostname === 'api.anthropic.com' || /\/anthropic(?:\/|$)/.test(path)
      ? 'anthropic' : 'openai')
    : apiFormat;

  if (!/\/(?:chat\/completions|messages)$/.test(path)) {
    const base = path === '' || (format === 'anthropic' && !/\/v\d+(?:beta\d*)?$/.test(path))
      ? `${path}/v1` : path;
    url.pathname = `${base}/${format === 'anthropic' ? 'messages' : 'chat/completions'}`;
  } else {
    if ((format === 'anthropic') !== /\/messages$/.test(path)) {
      throw new Error('AI API format does not match the endpoint path');
    }
    url.pathname = path;
  }

  return { url: url.toString(), format };
}
