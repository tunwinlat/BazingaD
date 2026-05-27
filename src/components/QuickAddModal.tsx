'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Category } from '@/types';

interface QuickAddModalProps {
  mode: 'block' | 'category';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  defaultCategoryId?: string;
}

const categoryIcons = [
  { value: 'default', label: 'Default' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'media', label: 'Media' },
  { value: 'dev', label: 'Development' },
  { value: 'social', label: 'Social' },
  { value: 'shopping', label: 'Shopping' },
];

export default function QuickAddModal({
  mode,
  isOpen,
  onClose,
  onSuccess,
  categories,
  defaultCategoryId,
}: QuickAddModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Block form state
  const [blockTitle, setBlockTitle] = useState('');
  const [blockUrl, setBlockUrl] = useState('');
  const [blockDescription, setBlockDescription] = useState('');
  const [blockIcon, setBlockIcon] = useState('');
  const [blockCategoryId, setBlockCategoryId] = useState(defaultCategoryId || '');

  // Category form state
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('default');

  useEffect(() => {
    setBlockCategoryId(defaultCategoryId || '');
  }, [defaultCategoryId]);

  const resetBlockForm = useCallback(() => {
    setBlockTitle('');
    setBlockUrl('');
    setBlockDescription('');
    setBlockIcon('');
    setBlockCategoryId(defaultCategoryId || '');
  }, [defaultCategoryId]);

  const resetCategoryForm = useCallback(() => {
    setCategoryName('');
    setCategoryIcon('default');
  }, []);

  const handleClose = useCallback(() => {
    resetBlockForm();
    resetCategoryForm();
    onClose();
  }, [resetBlockForm, resetCategoryForm, onClose]);

  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTitle.trim() || !blockUrl.trim() || !blockCategoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: blockTitle.trim(),
          url: blockUrl.trim(),
          description: blockDescription.trim() || undefined,
          icon: blockIcon.trim() || undefined,
          categoryId: blockCategoryId,
          sortOrder: 0,
          isMonitored: false,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create block');
      }

      toast.success('Block added successfully');
      resetBlockForm();
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create block');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryName.trim(),
          icon: categoryIcon,
          sortOrder: 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create category');
      }

      toast.success('Category added successfully');
      resetCategoryForm();
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
        className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 id="quick-add-title" className="text-xl font-semibold">
            {mode === 'block' ? 'Add Block' : 'Add Category'}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'block' ? (
          <form onSubmit={handleSaveBlock} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Title *</label>
              <input
                type="text"
                value={blockTitle}
                onChange={(e) => setBlockTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500"
                placeholder="e.g., GitHub"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">URL *</label>
              <input
                type="url"
                value={blockUrl}
                onChange={(e) => setBlockUrl(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500"
                placeholder="https://github.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Description</label>
              <input
                type="text"
                value={blockDescription}
                onChange={(e) => setBlockDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500"
                placeholder="Brief description"
              />
            </div>

            {!defaultCategoryId && (
              <div>
                <label className="block text-sm text-white/70 mb-1">Category *</label>
                <select
                  value={blockCategoryId}
                  onChange={(e) => setBlockCategoryId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                  }}
                  required
                >
                  <option value="" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>
                    Select a category
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} style={{ backgroundColor: '#1a1a2e', color: 'white' }}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm text-white/70 mb-1">Custom Icon URL</label>
              <input
                type="url"
                value={blockIcon}
                onChange={(e) => setBlockIcon(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500"
                placeholder="https://example.com/icon.png"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 rounded-lg transition-colors hover:bg-white/10"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#6366f1' }}
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? 'Adding...' : 'Add Block'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Name *</label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500"
                placeholder="e.g., Development"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Icon</label>
              <select
                value={categoryIcon}
                onChange={(e) => setCategoryIcon(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                }}
              >
                {categoryIcons.map((icon) => (
                  <option key={icon.value} value={icon.value} style={{ backgroundColor: '#1a1a2e', color: 'white' }}>
                    {icon.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 rounded-lg transition-colors hover:bg-white/10"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#6366f1' }}
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
