'use client';

import { useState, useEffect, useCallback } from 'react';
import { Newspaper, ChevronRight } from 'lucide-react';
import type { NewsArticle } from '@/types';

interface NewsTickerProps {
  onClick?: () => void;
  compact?: boolean;
}

export default function NewsTicker({ onClick, compact = false }: NewsTickerProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const fetchArticles = useCallback(async () => {
    try {
      const response = await fetch('/api/news');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setArticles(data);
          setCurrentIndex(0);
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
    const interval = setInterval(fetchArticles, 2 * 60 * 1000); // Every 2 minutes
    return () => clearInterval(interval);
  }, [fetchArticles]);

  useEffect(() => {
    if (articles.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [articles.length]);

  if (!isVisible || articles.length === 0) return null;

  const article = articles[currentIndex];
  const displayTitle = article.aiTitle || article.originalTitle;

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Open news: ${displayTitle}`}
        className="flex items-center gap-1.5 w-full text-left group rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <Newspaper className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--theme-primary)' }} />
        <span
          className="text-sm truncate flex-1 transition-opacity duration-500"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {displayTitle}
        </span>
        <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--theme-text-muted)' }} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open news: ${displayTitle}`}
      className="flex items-center gap-2 text-left group/ticker min-w-0 flex-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <Newspaper className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--theme-primary)' }} />
      <div className="min-w-0 flex-1 overflow-hidden">
        <div
          className="text-sm font-medium truncate transition-all duration-500"
          style={{ color: 'var(--theme-text)' }}
        >
          {displayTitle}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
            {article.sourceFeed.name}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
            ·
          </span>
          <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
            {formatTimeAgo(article.publishedAt)}
          </span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover/ticker:opacity-100 transition-opacity" style={{ color: 'var(--theme-text-muted)' }} />
    </button>
  );
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}
