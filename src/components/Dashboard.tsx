'use client';

import { useState, useEffect } from 'react';
import CategorySection from './CategorySection';
import type { Category } from '@/types';

export default function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
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

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="w-10 h-10 border-3 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-white/70">
        <div className="text-4xl mb-4">⚠️</div>
        <p>Failed to load dashboard</p>
        <p className="text-sm mt-2 text-white/50">{error}</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-16 text-white/50">
        <div className="text-5xl mb-4">📂</div>
        <p>No categories found. Add some in the admin panel!</p>
      </div>
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
