import { getInitials, getDomain, getBlockIcon } from '@/lib/utils';
import type { Block } from '@/types';

interface BlockCardProps {
  block: Block;
}

export default function BlockCard({ block }: BlockCardProps) {
  const iconUrl = getBlockIcon(block);
  const initials = getInitials(block.title);
  const domain = getDomain(block.url);

  return (
    <a
      href={block.url}
      target="_blank"
      rel="noopener noreferrer"
      title={block.description || block.title}
      aria-label={`${block.title}${block.description ? ` - ${block.description}` : ''}`}
      className="group flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      style={{
        backgroundColor: 'var(--theme-surface)',
        border: '1px solid var(--theme-surface-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${'var(--theme-primary)'}08 0%, ${'var(--theme-accent)'}08 100%)`,
        }}
      />
      
      <div 
        className="relative w-12 h-12 rounded-xl mb-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 overflow-hidden shadow-lg"
      >
        {/* Icon image (custom or generated gradient) */}
        <img
          src={iconUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />

        {/* Initials overlay — only shown when no custom icon is set */}
        {!block.icon && (
          <span
            className="relative z-10 text-white font-bold text-sm tracking-wider drop-shadow-md"
            style={{
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          >
            {initials}
          </span>
        )}
      </div>
      
      <div className="relative z-10">
        <div className="text-sm font-medium truncate max-w-full" style={{ color: 'var(--theme-text)' }}>{block.title}</div>
        <div className="text-xs mt-1 truncate max-w-full" style={{ color: 'var(--theme-text-muted)' }}>{domain}</div>
      </div>
      
      {block.isMonitored && block.lastStatus && (
        <div 
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={{
            backgroundColor: block.lastStatus === 'online' ? '#10b981' : 
                            block.lastStatus === 'offline' ? '#ef4444' : '#f59e0b'
          }}
        />
      )}
    </a>
  );
}
