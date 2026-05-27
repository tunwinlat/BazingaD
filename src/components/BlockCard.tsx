import { getInitials, getDomain, getBlockIcon } from '@/lib/utils';
import { triggerTransition } from '@/lib/navTransition';
import { ExternalLink } from 'lucide-react';
import type { Block, ViewMode } from '@/types';

interface BlockCardProps {
  block: Block;
  viewMode?: ViewMode;
  openInNewTab?: boolean;
  navTransitionEnabled?: boolean;
  navTransitionType?: 'overlay' | 'exit';
}

export default function BlockCard({
  block,
  viewMode = 'comfortable',
  openInNewTab = true,
  navTransitionEnabled = false,
  navTransitionType = 'overlay',
}: BlockCardProps) {
  const iconUrl = getBlockIcon(block);
  const initials = getInitials(block.title);
  const domain = getDomain(block.url);

  const linkProps = openInNewTab
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  const handleClick = (e: React.MouseEvent) => {
    if (!openInNewTab && navTransitionEnabled) {
      e.preventDefault();
      triggerTransition(block.url, block.title, block.icon || undefined, navTransitionType);
    }
  };

  // List view: horizontal row
  if (viewMode === 'list') {
    return (
      <a
        href={block.url}
        {...linkProps}
        onClick={handleClick}
        title={block.description || block.title}
        aria-label={`${block.title}${block.description ? ` - ${block.description}` : ''}`}
        className="group flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-200 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        style={{
          backgroundColor: 'var(--theme-surface)',
          border: '1px solid var(--theme-surface-border)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.07)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--theme-surface)';
        }}
      >
        {/* Icon */}
        <div className="relative w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={iconUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
          {!block.icon && (
            <span
              className="relative z-10 text-white font-bold text-xs tracking-wider drop-shadow-md"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              {initials}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>
            {block.title}
          </div>
          <div className="text-xs truncate mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {block.description || domain}
          </div>
        </div>

        {/* Right side: status + action */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {block.isMonitored && block.lastStatus && (
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  block.lastStatus === 'online'
                    ? '#10b981'
                    : block.lastStatus === 'offline'
                      ? '#ef4444'
                      : '#f59e0b',
              }}
              title={`Status: ${block.lastStatus}`}
            />
          )}
          <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors duration-200" />
        </div>
      </a>
    );
  }

  // Card views: comfortable, compact, dense
  const isDense = viewMode === 'dense';
  const isCompact = viewMode === 'compact';

  const iconSize = isDense ? 'w-8 h-8' : isCompact ? 'w-10 h-10' : 'w-12 h-12';
  const padding = isDense ? 'p-3' : isCompact ? 'p-4' : 'p-6';
  const titleSize = isDense ? 'text-xs' : 'text-sm';
  const showDomain = !isDense;
  const gap = isDense ? 'mb-2' : 'mb-3';

  return (
    <a
      href={block.url}
      {...linkProps}
      onClick={handleClick}
      title={block.description || block.title}
      aria-label={`${block.title}${block.description ? ` - ${block.description}` : ''}`}
      className={`group flex flex-col items-center text-center ${padding} rounded-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
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
        className={`relative ${iconSize} rounded-xl ${gap} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 overflow-hidden shadow-lg`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />

        {!block.icon && (
          <span
            className="relative z-10 text-white font-bold text-xs tracking-wider drop-shadow-md"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            {initials}
          </span>
        )}
      </div>

      <div className="relative z-10 w-full">
        <div className={`${titleSize} font-medium truncate max-w-full`} style={{ color: 'var(--theme-text)' }}>
          {block.title}
        </div>
        {showDomain && (
          <div className="text-xs mt-1 truncate max-w-full" style={{ color: 'var(--theme-text-muted)' }}>
            {domain}
          </div>
        )}
      </div>

      {block.isMonitored && block.lastStatus && (
        <div
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={{
            backgroundColor:
              block.lastStatus === 'online'
                ? '#10b981'
                : block.lastStatus === 'offline'
                  ? '#ef4444'
                  : '#f59e0b',
          }}
        />
      )}
    </a>
  );
}
