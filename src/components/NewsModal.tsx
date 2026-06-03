'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ExternalLink, Newspaper, Clock, CheckCircle2, Circle } from 'lucide-react';
import { triggerTransition } from '@/lib/navTransition';
import type { NewsArticle } from '@/types';

interface NewsModalProps {
  articles: NewsArticle[];
  isOpen: boolean;
  onClose: () => void;
  navTransitionEnabled?: boolean;
}

export default function NewsModal({ articles, isOpen, onClose, navTransitionEnabled = false }: NewsModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());
  const autoMarkedRef = useRef<Set<string>>(new Set());

  const selectedArticle = articles.find((a) => a.id === selectedId) || articles[0];

  useEffect(() => {
    if (isOpen && articles.length > 0 && !selectedId) {
      setSelectedId(articles[0].id);
    }
  }, [isOpen, articles, selectedId]);

  // Auto-mark as read when an article is selected (user is reading the summary)
  useEffect(() => {
    if (!selectedId) return;
    if (selectedArticle?.isRead) return;
    if (autoMarkedRef.current.has(selectedId)) return;
    if (readArticles.has(selectedId)) return;

    autoMarkedRef.current.add(selectedId);
    handleMarkRead(selectedId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (articles.length === 0) return;
      const currentIndex = articles.findIndex((a) => a.id === selectedId);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(currentIndex + 1, articles.length - 1);
        setSelectedId(articles[next].id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max(currentIndex - 1, 0);
        setSelectedId(articles[prev].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, articles, selectedId, onClose]);

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
    if (navTransitionEnabled) {
      triggerTransition(article.url, article.aiTitle || article.originalTitle, undefined, 'overlay');
    } else {
      window.open(article.url, '_blank');
    }
  }, [navTransitionEnabled, handleMarkRead]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col md:flex-row"
        style={{
          backgroundColor: 'rgba(20, 20, 30, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Left Column - Article List */}
        <div
          className="w-full md:w-[360px] flex-shrink-0 flex flex-col border-b md:border-b-0 md:border-r"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
                News
              </h2>
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
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: 'var(--theme-text-muted)' }}
              aria-label="Close news modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
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
                      className="w-full text-left px-5 py-3 transition-all duration-150"
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
        </div>

        {/* Right Column - Article Detail */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedArticle ? (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-6">
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
                  className="text-xl md:text-2xl font-bold leading-tight mb-4"
                  style={{ color: 'var(--theme-text)' }}
                >
                  {selectedArticle.aiTitle || selectedArticle.originalTitle}
                </h1>

                {selectedArticle.summary ? (
                  <div
                    className="text-base leading-relaxed"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    {selectedArticle.summary}
                  </div>
                ) : (
                  <p className="text-sm italic" style={{ color: 'var(--theme-text-muted)' }}>
                    Summary not available yet.
                  </p>
                )}
              </div>

              {/* Footer with Read button */}
              <div
                className="px-6 py-4 border-t"
                style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
              >
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
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
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
