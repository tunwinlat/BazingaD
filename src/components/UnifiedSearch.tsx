'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ExternalLink, Globe, X } from 'lucide-react';
import type { Category } from '@/types';

interface UnifiedSearchProps {
  categories: Category[];
}

export default function UnifiedSearch({ categories }: UnifiedSearchProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten all blocks for searching
  const allBlocks = useMemo(() => {
    return categories.flatMap(category =>
      (category.blocks || []).map(block => ({
        ...block,
        categoryName: category.name,
      }))
    );
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

  // Total results including Google search option
  const totalResults = filteredBlocks.length + (query.trim() ? 1 : 0);

  // Reset selected index when results change
  useEffect(() => {
    // We intentionally reset selected index when query or results change
    setSelectedIndex(0);
  }, [filteredBlocks.length, query]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // '/' to focus search
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Escape to blur
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setIsFocused(false);
      }

      if (!isFocused || totalResults === 0) return;

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < totalResults - 1 ? prev + 1 : prev
        );
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }

      // Enter to open
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex < filteredBlocks.length) {
          // Open block
          const selected = filteredBlocks[selectedIndex];
          window.open(selected.url, '_blank');
        } else {
          // Google search
          window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        }
        setQuery('');
        inputRef.current?.blur();
        setIsFocused(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, filteredBlocks, selectedIndex, query, totalResults]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBlockClick = (url: string) => {
    window.open(url, '_blank');
    setQuery('');
    setIsFocused(false);
  };

  const handleGoogleSearch = () => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    setQuery('');
    setIsFocused(false);
  };

  return (
    <div ref={containerRef} className="max-w-xl mx-auto relative">
      {/* Search Input */}
      <div
        className="flex items-center rounded-full px-4 py-2 transition-all duration-300"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${isFocused ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: isFocused ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : 'none',
        }}
      >
        <Search className="w-5 h-5 text-white/50 ml-2" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search your blocks or the web..."
          aria-label="Search your blocks or the web"
          role="combobox"
          aria-expanded={isFocused && query.trim() ? "true" : "false"}
          aria-controls="search-results"
          aria-activedescendant={isFocused && query.trim() ? `search-result-${selectedIndex}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 px-3 py-2 text-base"
          style={{
            outline: 'none',
            boxShadow: 'none',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="p-1 mr-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Clear search"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <kbd
          className="hidden sm:block px-2 py-1 rounded text-xs text-white/40"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          /
        </kbd>
      </div>

      {/* Dropdown Results */}
      {isFocused && query.trim() && (
        <div
          id="search-results"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
          style={{
            backgroundColor: 'rgba(30, 30, 50, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Block Results */}
          {filteredBlocks.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1 text-xs text-white/40 uppercase tracking-wider">
                Your Blocks
              </div>
              {filteredBlocks.map((block, index) => (
                <button
                  id={`search-result-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  key={block.id}
                  onClick={() => handleBlockClick(block.url)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{
                    backgroundColor:
                      index === selectedIndex
                        ? 'rgba(99, 102, 241, 0.2)'
                        : 'transparent',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    {block.icon ? (
                      <img
                        src={block.icon}
                        alt=""
                        className="w-5 h-5 object-contain"
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
                      <span className="font-medium text-white text-sm truncate">
                        {block.title}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', fontSize: '10px' }}
                      >
                        {block.categoryName}
                      </span>
                    </div>
                    {block.description && (
                      <p className="text-xs text-white/50 truncate">
                        {block.description}
                      </p>
                    )}
                  </div>

                  <ExternalLink className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Google Search Option */}
          {query.trim() && (
            <div className="border-t border-white/10 py-2">
              <button
                id={`search-result-${filteredBlocks.length}`}
                role="option"
                aria-selected={selectedIndex === filteredBlocks.length}
                onClick={handleGoogleSearch}
                onMouseEnter={() => setSelectedIndex(filteredBlocks.length)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{
                  backgroundColor:
                    selectedIndex === filteredBlocks.length
                      ? 'rgba(99, 102, 241, 0.2)'
                      : 'transparent',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <Globe className="w-4 h-4 text-white/60" />
                </div>
                <div className="flex-1">
                  <span className="text-white text-sm">
                    Search Google for &quot;<span className="text-indigo-400">{query}</span>&quot;
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
              </button>
            </div>
          )}

          {/* Empty State */}
          {filteredBlocks.length === 0 && (
            <div className="px-4 py-3 text-sm text-white/40">
              No blocks found. Press Enter to search Google.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
