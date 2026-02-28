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
  blocks: Block[];
}

export interface BlockFormData {
  title: string;
  url: string;
  description?: string;
  icon?: string;
  categoryId: string;
  serviceUrl?: string;
  serviceType?: string;
  healthCheckUrl?: string;
  isMonitored: boolean;
}

export interface CategoryFormData {
  name: string;
  icon: string;
  sortOrder?: number;
}

export type ServiceStatus = 'online' | 'offline' | 'unknown' | 'checking';

export interface ServiceHealth {
  blockId: string;
  status: ServiceStatus;
  responseTime?: number;
  lastChecked?: Date;
  error?: string;
}
