import UnifiedSearch from './UnifiedSearch';
import type { Category } from '@/types';

interface HeaderProps {
  categories: Category[];
  openInNewTab?: boolean;
}

export default function Header({ categories, openInNewTab = true }: HeaderProps) {
  return (
    <header className="text-center mb-10">
      <UnifiedSearch categories={categories} openInNewTab={openInNewTab} />
    </header>
  );
}
