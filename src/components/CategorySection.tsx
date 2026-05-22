import { Briefcase, User, Image, Code, Users, ShoppingCart, Circle, Plus, type LucideIcon } from 'lucide-react';
import BlockCard from './BlockCard';
import type { Category, ViewMode } from '@/types';

interface CategorySectionProps {
  category: Category;
  index: number;
  isAdmin?: boolean;
  onAddBlock?: (categoryId: string) => void;
  viewMode?: ViewMode;
  openInNewTab?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  work: Briefcase,
  personal: User,
  media: Image,
  dev: Code,
  social: Users,
  shopping: ShoppingCart,
  default: Circle,
};

export default function CategorySection({ category, index, isAdmin, onAddBlock, viewMode = 'comfortable', openInNewTab = true }: CategorySectionProps) {
  const Icon = iconMap[category.icon] || iconMap.default;

  const sortedBlocks = [...category.blocks].sort((a, b) =>
    a.title.toLowerCase().localeCompare(b.title.toLowerCase())
  );

  // Use literal class strings so Tailwind detects all classes
  const gridClass =
    viewMode === 'comfortable'
      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
      : viewMode === 'compact'
      ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3'
      : viewMode === 'dense'
      ? 'grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2'
      : 'grid grid-cols-1 gap-2';

  return (
    <section
      className="animate-fadeInUp"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-center gap-3 mb-4 px-1">
        <Icon className="w-6 h-6 text-indigo-400" />
        <h2 className="text-lg font-semibold text-white uppercase tracking-wider">
          {category.name}
        </h2>
        {isAdmin && onAddBlock && (
          <button
            onClick={() => onAddBlock(category.id)}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10 ml-auto"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            title={`Add block to ${category.name}`}
            aria-label={`Add block to ${category.name}`}
          >
            <Plus className="w-3.5 h-3.5 text-white/60" />
          </button>
        )}
        <span className="text-xs text-white/50 bg-white/5 px-3 py-1 rounded-full">
          {sortedBlocks.length}
        </span>
      </div>

      <div className={gridClass}>
        {sortedBlocks.map((block) => (
          <BlockCard key={block.id} block={block} viewMode={viewMode} openInNewTab={openInNewTab} />
        ))}
      </div>
    </section>
  );
}
