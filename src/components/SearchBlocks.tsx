'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X, ExternalLink } from 'lucide-react';
import type { Category, Block } from '@/types';

interface SearchBlocksProps {
  categories: Category[];
}

export default function SearchBlocks({ categories }: SearchBlocksProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Flatten all blocks for searching
  const allBlocks = useMemo(() => {
    const blocks: (Block & { categoryName: string })[] = [];
    categories.forEach((category) => {
      category.blocks?.forEach((block) => {
        blocks.push({
          ...block,
          categoryName: category.name,
        });
      });
    });
    return blocks;
  }, [categories]);

  // Filter blocks based on query
  const filteredBlocks = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return allBlocks.filter(
      (block) =>
        block.title.toLowerCase().includes(lowerQuery) ||
        block.description?.toLowerCase().includes(lowerQuery) ||
        block.url.toLowerCase().includes(lowerQuery)
    );
  }, [query, allBlocks]);

  // Reset selected index when filtered blocks change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredBlocks]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }

      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }

      if (!isOpen || filteredBlocks.length === 0) return;

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredBlocks.length - 1 ? prev + 1 : prev
        );
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }

      // Enter to open
      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredBlocks[selectedIndex];
        if (selected) {
          window.open(selected.url, '_blank');
          setIsOpen(false);
          setQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredBlocks, selectedIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const input = document.getElementById('block-search-input');
      input?.focus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 z-40"
        style={{
          backgroundColor: 'rgba(99, 102, 241, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
        }}
        title="Search blocks (Ctrl+K)"
      >
        <Search className="w-5 h-5 text-white" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          setIsOpen(false);
          setQuery('');
        }}
      />

      {/* Search Modal */}
      <div
        className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'rgba(30, 30, 50, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Search Input */}
        <div className="flex items-center px-6 py-4 border-b border-white/10">
          <Search className="w-5 h-5 text-white/50" />
          <input
            id="block-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your blocks..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 px-4 py-2 text-lg"
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          )}
          <kbd
            className="ml-4 px-2 py-1 rounded text-xs hidden sm:block"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {query.trim() === '' ? (
            <div className="px-6 py-8 text-center text-white/40">
              <p>Start typing to search your blocks</p>
              <p className="text-sm mt-2">
                Use <kbd className="px-1 rounded bg-white/10">↑</kbd>{' '}
                <kbd className="px-1 rounded bg-white/10">↓</kbd> to navigate,{' '}
                <kbd className="px-1 rounded bg-white/10">Enter</kbd> to open
              </p>
            </div>
          ) : filteredBlocks.length === 0 ? (
            <div className="px-6 py-8 text-center text-white/40">
              <p>No blocks found matching &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="py-2">
              {filteredBlocks.map((block, index) => (
                <a
                  key={block.id}
                  href={block.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 px-6 py-3 transition-colors"
                  style={{
                    backgroundColor:
                      index === selectedIndex
                        ? 'rgba(99, 102, 241, 0.2)'
                        : 'transparent',
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    setIsOpen(false);
                    setQuery('');
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    {block.icon ? (
                      <img
                        src={block.icon}
                        alt=""
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span>🔗</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        {block.title}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        {block.categoryName}
                      </span>
                    </div>
                    {block.description && (
                      <p className="text-sm text-white/50 truncate">
                        {block.description}
                      </p>
                    )}
                  </div>

                  {/* Open Icon */}
                  <ExternalLink className="w-4 h-4 text-white/30 flex-shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 text-xs text-white/40 flex items-center justify-between"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        >
          <span>{filteredBlocks.length} results</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10">↑↓</kbd> to
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10">↵</kbd> to
              open
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
