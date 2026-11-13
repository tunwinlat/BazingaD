import type { Settings } from '@prisma/client';
import { DEFAULT_AI_ENDPOINT, DEFAULT_AI_MODEL, MASKED_API_KEY, type AIFormat } from './ai-config';
import type { NewsSettings } from '@/types';

export function serializeNewsSettings(settings: Settings | null, admin = false): NewsSettings {
  return {
    enabled: settings?.newsEnabled ?? false,
    apiKey: admin && settings?.newsApiKey ? MASKED_API_KEY : null,
    endpoint: admin ? settings?.newsApiEndpoint ?? DEFAULT_AI_ENDPOINT : null,
    model: admin ? settings?.newsApiModel ?? DEFAULT_AI_MODEL : null,
    apiFormat: admin ? (settings?.newsApiFormat ?? 'auto') as AIFormat : null,
    checkIntervalMinutes: settings?.newsCheckIntervalMinutes ?? 60,
    unreadRetentionHours: settings?.newsUnreadRetentionHours ?? 24,
    readRetentionHours: settings?.newsReadRetentionHours ?? 8,
    maxArticleAgeHours: settings?.newsMaxArticleAgeHours ?? 24,
  };
}
