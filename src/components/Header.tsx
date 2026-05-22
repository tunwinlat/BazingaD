'use client';

import UnifiedSearch from './UnifiedSearch';
import type { Category } from '@/types';

interface HeaderProps {
  categories: Category[];
}

export default function Header({ categories }: HeaderProps) {
  return (
    <header className="text-center mb-10">
      <UnifiedSearch categories={categories} />
    </header>
  );
}
