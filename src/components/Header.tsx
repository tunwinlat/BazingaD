import UnifiedSearch from './UnifiedSearch';
import type { Category } from '@/types';

interface HeaderProps {
  categories: Category[];
  openInNewTab?: boolean;
  navTransitionEnabled?: boolean;
  navTransitionType?: 'overlay' | 'exit';
}

export default function Header({
  categories,
  openInNewTab = true,
  navTransitionEnabled = false,
  navTransitionType = 'overlay',
}: HeaderProps) {
  return (
    <header className="text-center mb-10">
      <UnifiedSearch
        categories={categories}
        openInNewTab={openInNewTab}
        navTransitionEnabled={navTransitionEnabled}
        navTransitionType={navTransitionType}
      />
    </header>
  );
}
