'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import CategorySection from './CategorySection';
import type { Category } from '@/types';

// Loading skeleton for categories
function CategorySkeleton() {
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
}

// Empty state component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6"
        style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
      >
        <span className="text-4xl">🚀</span>
      </div>
      <h2 className="text-2xl font-semibold text-white mb-2">
        Welcome to your Start Page!
      </h2>
      <p className="text-white/60 max-w-md mb-8">
        Your dashboard is empty. Add your first categories and blocks to get started with your personalized start page.
      </p>
      <Link
        href="/admin"
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
        style={{
          backgroundColor: 'rgba(99, 102, 241, 0.9)',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
        }}
      >
        <Plus className="w-5 h-5" />
        Add Your First Block
      </Link>
    </div>
  );
}

// Error state component
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6"
        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
      >
        <span className="text-4xl">⚠️</span>
      </div>
      <h2 className="text-2xl font-semibold text-white mb-2">
        Failed to load dashboard
      </h2>
      <p className="text-white/60 max-w-md mb-2">{error}</p>
      <button
        onClick={onRetry}
        className="px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 mt-4"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        Try Again
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <main className="flex-1 flex flex-col">
        <CategorySkeleton />
        <CategorySkeleton />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex flex-col">
        <ErrorState error={error} onRetry={fetchCategories} />
      </main>
    );
  }

  if (categories.length === 0) {
    return (
      <main className="flex-1 flex flex-col">
        <EmptyState />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col gap-8">
      {categories.map((category, index) => (
        <CategorySection key={category.id} category={category} index={index} />
      ))}
    </main>
  );
}
