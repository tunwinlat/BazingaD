export interface Block {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  categoryId: string;
  sortOrder: number;
  serviceUrl?: string;
  serviceType?: string;
  healthCheckUrl?: string;
  isMonitored: boolean;
  lastStatus?: string;
  lastCheckedAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
  disabled: boolean;
  blocks: Block[];
}

export interface BlockFormData {
  title: string;
  url: string;
  description?: string;
  icon?: string;
  categoryId: string;
  sortOrder: number;
  serviceUrl?: string;
  serviceType?: string;
  healthCheckUrl?: string;
  isMonitored: boolean;
}

export interface CategoryFormData {
  name: string;
  icon: string;
  sortOrder?: number;
  disabled?: boolean;
}

export type ViewMode = 'comfortable' | 'compact' | 'dense' | 'list';

export type ServiceStatus = 'online' | 'offline' | 'unknown' | 'checking';

export interface ServiceHealth {
  blockId: string;
  status: ServiceStatus;
  responseTime?: number;
  lastChecked?: Date;
  error?: string;
}

export interface NewsFeed {
  id: string;
  name: string;
  url: string;
  isDefault: boolean;
  isEnabled: boolean;
}

export interface NewsTopic {
  id: string;
  phrase: string;
}

export interface NewsArticle {
  id: string;
  aiTitle: string | null;
  originalTitle: string;
  summary: string | null;
  url: string;
  sourceFeed: NewsFeed;
  publishedAt: Date;
  isRead: boolean;
}

export interface NewsSettings {
  enabled: boolean;
  apiKey: string | null;
  checkIntervalMinutes: number;
  unreadRetentionHours: number;
  readRetentionHours: number;
}
