// Simple in-memory cache with TTL support
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTTL: number;

  constructor(defaultTTLSeconds: number = 300) { // 5 minutes default
    this.defaultTTL = defaultTTLSeconds * 1000;
    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = (ttlSeconds ?? this.defaultTTL / 1000) * 1000;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances
export const settingsCache = new MemoryCache(60); // 1 minute for settings
export const weatherCache = new MemoryCache(600); // 10 minutes for weather
export const trafficCache = new MemoryCache(1800); // 30 minutes for traffic
export const categoriesCache = new MemoryCache(300); // 5 minutes for categories
export const newsCache = new MemoryCache(60); // 1 minute for news articles
