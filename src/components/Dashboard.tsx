'use client';

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus } from 'lucide-react';
import CategorySection from './CategorySection';
import QuickAddModal from './QuickAddModal';
import TopBar from './TopBar';
import NavTransition from './NavTransition';
import NewsModal from './NewsModal';
import GadgetBar from './GadgetBar';
import type { Category, ViewMode, NewsArticle } from '@/types';

// Memoized loading skeleton
const CategorySkeleton = memo(function CategorySkeleton() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-6 w-32 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-white/5 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
});

// Memoized empty state
const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6"
        style={{ backgroundColor: 'var(--theme-surface)' }}
      >
        <span className="text-4xl">🚀</span>
      </div>
      <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--theme-text)' }}>
        Welcome to your Start Page!
      </h2>
      <p className="max-w-md mb-8" style={{ color: 'var(--theme-text-muted)' }}>
        Your dashboard is empty. Add your first categories and blocks to get started with your personalized start page.
      </p>
      <a
        href="/admin"
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        style={{
          backgroundColor: 'var(--theme-primary)',
          boxShadow: '0 4px 20px var(--theme-surface)',
        }}
      >
        Add Your First Block
      </a>
    </div>
  );
});

// Memoized error state
interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

const ErrorState = memo(function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6"
        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
      >
        <span className="text-4xl">⚠️</span>
      </div>
      <h2 className="text-2xl font-semibold text-white mb-2">Failed to load dashboard</h2>
      <p className="text-white/60 max-w-md mb-2">{error}</p>
      <button
        onClick={onRetry}
        className="px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        Try Again
      </button>
    </div>
  );
});

interface DashboardProps {
  isAdmin?: boolean;
  isProtected?: boolean;
  defaultView: ViewMode;
  openInNewTab?: boolean;
  navTransitionEnabled?: boolean;
  navTransitionType?: 'overlay' | 'exit';
  newsEnabled?: boolean;
  gadgetSettings?: {
    leftEnabled: boolean;
    rightEnabled: boolean;
    leftConfig: Array<{ type: string; id: string }>;
    rightConfig: Array<{ type: string; id: string }>;
  };
}

const VIEW_MODE_STORAGE_KEY = 'startpage-view-mode';

// Main Dashboard component
export default function Dashboard({
  isAdmin,
  isProtected,
  defaultView,
  openInNewTab = true,
  navTransitionEnabled = false,
  navTransitionType = 'overlay',
  newsEnabled = false,
  gadgetSettings,
}: DashboardProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'block' | 'category' | null>(null);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('');
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // View mode: localStorage override > server default
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  // Load user's view preference from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (saved === 'comfortable' || saved === 'compact' || saved === 'dense' || saved === 'list') {
        setViewMode(saved);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch news articles
  useEffect(() => {
    if (!newsEnabled) return;
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news');
        if (response.ok) {
          const data = await response.json();
          setNewsArticles(data);
        }
      } catch (error) {
        console.error('Failed to fetch news:', error);
      }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [newsEnabled]);

  // Persist view preference changes to localStorage
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // localStorage not available
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/categories', {
        headers: {
          'Cache-Control': 'max-age=60',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      // Filter out disabled and empty categories client-side as well
      setCategories(data.filter((cat: Category) => !cat.disabled && cat.blocks?.length > 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddBlock = useCallback((categoryId: string) => {
    setDefaultCategoryId(categoryId);
    setModalMode('block');
  }, []);

  const handleAddCategory = useCallback(() => {
    setDefaultCategoryId('');
    setModalMode('category');
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalMode(null);
    setDefaultCategoryId('');
  }, []);

  const handleNewsClick = useCallback(() => {
    if (isMobile) {
      router.push('/news');
    } else {
      // Refresh articles before opening modal
      fetch('/api/news')
        .then((r) => r.ok ? r.json() : [])
        .then((data) => {
          setNewsArticles(data);
          setNewsModalOpen(true);
        })
        .catch(console.error);
    }
  }, [isMobile, router]);

  // Memoize category sections to prevent unnecessary re-renders
  const categorySections = useMemo(() => {
    return categories.map((category, index) => (
      <CategorySection
        key={category.id}
        category={category}
        index={index}
        isAdmin={isAdmin}
        onAddBlock={handleAddBlock}
        viewMode={viewMode}
        openInNewTab={openInNewTab}
        navTransitionEnabled={navTransitionEnabled}
        navTransitionType={navTransitionType}
      />
    ));
  }, [categories, isAdmin, handleAddBlock, viewMode, openInNewTab, navTransitionEnabled, navTransitionType]);

  if (loading) {
    return (
      <>
        <TopBar isAdmin={isAdmin} isProtected={isProtected} viewMode={viewMode} onViewModeChange={handleViewModeChange} onNewsClick={newsEnabled ? handleNewsClick : undefined} />
        <main className="flex-1 flex flex-col">
          <CategorySkeleton />
          <CategorySkeleton />
        </main>
        <NavTransition />
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopBar isAdmin={isAdmin} isProtected={isProtected} viewMode={viewMode} onViewModeChange={handleViewModeChange} onNewsClick={newsEnabled ? handleNewsClick : undefined} />
        <main className="flex-1 flex flex-col">
          <ErrorState error={error} onRetry={fetchCategories} />
        </main>
        <NavTransition />
      </>
    );
  }

  if (categories.length === 0) {
    return (
      <>
        <TopBar isAdmin={isAdmin} isProtected={isProtected} viewMode={viewMode} onViewModeChange={handleViewModeChange} onNewsClick={newsEnabled ? handleNewsClick : undefined} />
        <main className="flex-1 flex flex-col">
          <EmptyState />
        </main>
        <NavTransition />
      </>
    );
  }

  return (
    <>
      <TopBar isAdmin={isAdmin} isProtected={isProtected} viewMode={viewMode} onViewModeChange={handleViewModeChange} onNewsClick={newsEnabled ? handleNewsClick : undefined} />
      <main className="flex-1 flex flex-col gap-8">
        {categorySections}

        {/* Admin quick-add category button */}
        {isAdmin && (
          <button
            onClick={handleAddCategory}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl transition-all hover:scale-[1.01] border border-dashed"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderColor: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            <FolderPlus className="w-5 h-5" />
            <span className="font-medium">Add Category</span>
          </button>
        )}
      </main>

      <QuickAddModal
        mode={modalMode === 'block' ? 'block' : 'category'}
        isOpen={modalMode !== null}
        onClose={handleCloseModal}
        onSuccess={fetchCategories}
        categories={categories}
        defaultCategoryId={defaultCategoryId || undefined}
      />

      <NavTransition />

      {newsEnabled && (
        <NewsModal
          articles={newsArticles}
          isOpen={newsModalOpen}
          onClose={() => setNewsModalOpen(false)}
          navTransitionEnabled={navTransitionEnabled}
        />
      )}

      {/* Gadget Bars */}
      {gadgetSettings && (
        <>
          <GadgetBar
            side="left"
            enabled={gadgetSettings.leftEnabled}
            config={gadgetSettings.leftConfig as Array<{ type: 'password'; id: string }>}
          />
          <GadgetBar
            side="right"
            enabled={gadgetSettings.rightEnabled}
            config={gadgetSettings.rightConfig as Array<{ type: 'password'; id: string }>}
          />
        </>
      )}
    </>
  );
}
