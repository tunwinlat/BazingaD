export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getDomain = (url: string): string => {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch {
    return url;
  }
};

// Generate a hash from a string for deterministic randomization
const getHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

// Vibrant gradient combinations for unique icons
const GRADIENT_PAIRS = [
  { from: '#6366f1', to: '#8b5cf6' },      // Indigo to Purple
  { from: '#ec4899', to: '#f43f5e' },      // Pink to Rose
  { from: '#06b6d4', to: '#3b82f6' },      // Cyan to Blue
  { from: '#10b981', to: '#22c55e' },      // Emerald to Green
  { from: '#f59e0b', to: '#ef4444' },      // Amber to Red
  { from: '#8b5cf6', to: '#d946ef' },      // Purple to Fuchsia
  { from: '#14b8a6', to: '#0ea5e9' },      // Teal to Sky
  { from: '#f97316', to: '#eab308' },      // Orange to Yellow
  { from: '#84cc16', to: '#10b981' },      // Lime to Emerald
  { from: '#6366f1', to: '#06b6d4' },      // Indigo to Cyan
  { from: '#e879f9', to: '#ec4899' },      // Fuchsia to Pink
  { from: '#3b82f6', to: '#8b5cf6' },      // Blue to Purple
];

// Geometric patterns for the icon background
const PATTERNS = [
  // Diagonal stripes
  (colors: { from: string; to: string }) => `
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.from}"/>
        <stop offset="100%" style="stop-color:${colors.to}"/>
      </linearGradient>
      <pattern id="p" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect x="0" y="0" width="10" height="20" fill="rgba(255,255,255,0.15)"/>
      </pattern>
    </defs>
    <rect width="100" height="100" rx="20" fill="url(#g)"/>
    <rect width="100" height="100" rx="20" fill="url(#p)"/>
  `,
  // Dots pattern
  (colors: { from: string; to: string }) => `
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.from}"/>
        <stop offset="100%" style="stop-color:${colors.to}"/>
      </linearGradient>
      <pattern id="p" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
        <circle cx="12.5" cy="12.5" r="3" fill="rgba(255,255,255,0.2)"/>
      </pattern>
    </defs>
    <rect width="100" height="100" rx="20" fill="url(#g)"/>
    <rect width="100" height="100" rx="20" fill="url(#p)"/>
  `,
  // Circles/rings pattern
  (colors: { from: string; to: string }) => `
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.from}"/>
        <stop offset="100%" style="stop-color:${colors.to}"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="20" fill="url(#g)"/>
    <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>
    <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>
    <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>
  `,
  // Hexagon pattern
  (colors: { from: string; to: string }) => `
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.from}"/>
        <stop offset="100%" style="stop-color:${colors.to}"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="20" fill="url(#g)"/>
    <path d="M50 25 L68 35 L68 55 L50 65 L32 55 L32 35 Z" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2.5"/>
    <path d="M50 15 L78 30 L78 60 L50 75 L22 60 L22 30 Z" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
  `,
  // Grid pattern
  (colors: { from: string; to: string }) => `
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.from}"/>
        <stop offset="100%" style="stop-color:${colors.to}"/>
      </linearGradient>
      <pattern id="p" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
      </pattern>
    </defs>
    <rect width="100" height="100" rx="20" fill="url(#g)"/>
    <rect width="100" height="100" rx="20" fill="url(#p)"/>
  `,
  // Corner rays
  (colors: { from: string; to: string }) => `
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.from}"/>
        <stop offset="100%" style="stop-color:${colors.to}"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="20" fill="url(#g)"/>
    <path d="M0 0 L40 0 L0 40 Z" fill="rgba(255,255,255,0.12)"/>
    <path d="M100 100 L60 100 L100 60 Z" fill="rgba(255,255,255,0.12)"/>
    <circle cx="50" cy="50" r="20" fill="rgba(255,255,255,0.1)"/>
  `,
  // Diamond shapes
  (colors: { from: string; to: string }) => `
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.from}"/>
        <stop offset="100%" style="stop-color:${colors.to}"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="20" fill="url(#g)"/>
    <path d="M50 20 L80 50 L50 80 L20 50 Z" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2.5"/>
    <path d="M50 30 L70 50 L50 70 L30 50 Z" fill="rgba(255,255,255,0.1)"/>
  `,
  // Waves
  (colors: { from: string; to: string }) => `
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.from}"/>
        <stop offset="100%" style="stop-color:${colors.to}"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="20" fill="url(#g)"/>
    <path d="M0 60 Q25 40 50 60 T100 60" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>
    <path d="M0 75 Q25 55 50 75 T100 75" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="3"/>
  `,
];

/**
 * Generate a unique, deterministic icon for a URL
 * Creates an SVG with gradient background and geometric pattern
 */
export const generateBlockIcon = (url: string): string => {
  try {
    const domain = getDomain(url);
    const hash = getHash(domain);
    
    // Select gradient and pattern based on hash
    const gradientPair = GRADIENT_PAIRS[hash % GRADIENT_PAIRS.length];
    const patternFn = PATTERNS[Math.floor((hash / GRADIENT_PAIRS.length) % PATTERNS.length)];
    
    const svgContent = patternFn(gradientPair);
    
    // Build complete SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${svgContent}</svg>`;
    
    // Return as data URI
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  } catch {
    // Fallback to a default gradient
    const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1"/>
          <stop offset="100%" style="stop-color:#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="20" fill="url(#g)"/>
      <circle cx="50" cy="50" r="25" fill="rgba(255,255,255,0.15)"/>
    </svg>`;
    return `data:image/svg+xml,${encodeURIComponent(defaultSvg)}`;
  }
};

/**
 * Get favicon URL from Google's favicon service
 * Note: This returns the Google favicon service URL, the fetching happens in the component
 */
export const getFavicon = (url: string): string | null => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
};

/**
 * Get the best available icon for a block
 * Priority: 1. Custom icon, 2. Generated unique icon based on domain
 * (Removed external favicon fetching to avoid blurry icons)
 */
export const getBlockIcon = (block: { icon?: string | null; url: string }): string => {
  // If custom icon is provided, use it
  if (block.icon) {
    return block.icon;
  }
  
  // Otherwise generate a unique icon based on the URL
  return generateBlockIcon(block.url);
};

export const sortAlphabetically = <T extends { title: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const titleA = a.title.toLowerCase();
    const titleB = b.title.toLowerCase();
    return titleA.localeCompare(titleB);
  });
};
