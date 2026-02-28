import { Briefcase, User, Image, Code, Users, ShoppingCart, Circle, type LucideIcon } from 'lucide-react';
import BlockCard from './BlockCard';
import type { Category } from '@/types';

interface CategorySectionProps {
  category: Category;
  index: number;
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

export default function CategorySection({ category, index }: CategorySectionProps) {
  const Icon = iconMap[category.icon] || iconMap.default;
  
  const sortedBlocks = [...category.blocks].sort((a, b) => 
    a.title.toLowerCase().localeCompare(b.title.toLowerCase())
  );

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
        <span className="text-xs text-white/50 bg-white/5 px-3 py-1 rounded-full ml-auto">
          {sortedBlocks.length}
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {sortedBlocks.map((block) => (
          <BlockCard key={block.id} block={block} />
        ))}
      </div>
    </section>
  );
}
