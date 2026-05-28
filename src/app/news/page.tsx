'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Newspaper, Clock, CheckCircle2, Circle } from 'lucide-react';
import { triggerTransition } from '@/lib/navTransition';
import type { NewsArticle } from '@/types';

export default function NewsPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());

  const fetchArticles = useCallback(async () => {
    try {
      const response = await fetch('/api/news');
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleMarkRead = useCallback(async (articleId: string) => {
    try {
      await fetch(`/api/news/${articleId}/read`, { method: 'POST' });
      setReadArticles((prev) => new Set(prev).add(articleId));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, []);

  const handleOpenArticle = useCallback((article: NewsArticle) => {
    handleMarkRead(article.id);
    triggerTransition(article.url, article.aiTitle || article.originalTitle, undefined, 'overlay');
  }, [handleMarkRead]);

  const selectedArticle = articles.find((a) => a.id === selectedId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--theme-background)' }}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--theme-background)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b"
        style={{
          backgroundColor: 'rgba(20, 20, 30, 0.8)',
          backdropFilter: 'blur(16px)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          type="button"
          onClick={() => router.push('/')}
          className="p-2 -ml-2 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: 'var(--theme-text)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
          <h1 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
            News
          </h1>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: 'var(--theme-text-muted)',
            }}
          >
            {articles.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Article List */}
        <div
          className="w-full md:w-[360px] flex-shrink-0 overflow-y-auto border-b md:border-b-0 md:border-r"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          {articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Newspaper className="w-10 h-10 mb-3 opacity-30" style={{ color: 'var(--theme-text-muted)' }} />
              <p style={{ color: 'var(--theme-text-muted)' }}>No news articles available</p>
            </div>
          ) : (
            <div className="py-2">
              {articles.map((article) => {
                const isSelected = selectedArticle?.id === article.id;
                const isRead = article.isRead || readArticles.has(article.id);
                const displayTitle = article.aiTitle || article.originalTitle;
                return (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => setSelectedId(article.id)}
                    className="w-full text-left px-4 py-3 transition-all duration-150"
                    style={{
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--theme-primary)' : '3px solid transparent',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {isRead ? (
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-40" style={{ color: 'var(--theme-text-muted)' }} />
                      ) : (
                        <Circle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--theme-primary)' }} />
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm leading-snug mb-1"
                          style={{
                            color: isRead ? 'var(--theme-text-muted)' : 'var(--theme-text)',
                            fontWeight: isSelected ? 500 : 400,
                          }}
                        >
                          {displayTitle}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                            {article.sourceFeed.name}
                          </span>
                          <span className="text-[11px] opacity-30" style={{ color: 'var(--theme-text-muted)' }}>
                            ·
                          </span>
                          <span className="text-[11px] flex items-center gap-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(article.publishedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Article Detail */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {selectedArticle ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="text-xs px-2 py-1 rounded-md"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  {selectedArticle.sourceFeed.name}
                </span>
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--theme-text-muted)' }}>
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(selectedArticle.publishedAt)}
                </span>
              </div>

              <h1
                className="text-xl font-bold leading-tight mb-4"
                style={{ color: 'var(--theme-text)' }}
              >
                {selectedArticle.aiTitle || selectedArticle.originalTitle}
              </h1>

              {selectedArticle.summary ? (
                <div
                  className="text-base leading-relaxed mb-6"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  {selectedArticle.summary}
                </div>
              ) : (
                <p className="text-sm italic mb-6" style={{ color: 'var(--theme-text-muted)' }}>
                  Summary not available yet.
                </p>
              )}

              <button
                type="button"
                onClick={() => handleOpenArticle(selectedArticle)}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl font-medium transition-all hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Read Full Article
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: 'var(--theme-text-muted)' }}>Select an article to read</p>
            </div>
          )}
        </div>
      </div>
    </div>
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
