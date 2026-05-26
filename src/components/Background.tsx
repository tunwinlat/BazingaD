'use client';

import { memo } from 'react';
import { useTheme } from './ThemeProvider';

// Memoized background component to prevent unnecessary re-renders
const Background = memo(function Background() {
  const { theme, isLoading } = useTheme();

  // Show a placeholder while theme is loading
  if (isLoading) {
    return (
      <div 
        className="fixed inset-0 -z-10 overflow-hidden" 
        style={{ backgroundColor: '#0f0f1a' }}
      />
    );
  }

  return (
    <div 
      className="fixed inset-0 -z-10 overflow-hidden transition-colors duration-1000" 
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* Gradient sphere 1 - Top Right */}
      <div 
        className="absolute rounded-full animate-float transition-all duration-1000"
        style={{
          width: '600px',
          height: '600px',
          background: theme.orbs.color1,
          top: '-200px',
          right: '-100px',
          filter: 'blur(80px)',
          opacity: 0.5,
        }}
      />
      {/* Gradient sphere 2 - Bottom Left */}
      <div 
        className="absolute rounded-full animate-float transition-all duration-1000"
        style={{
          width: '500px',
          height: '500px',
          background: theme.orbs.color2,
          bottom: '-150px',
          left: '-100px',
          filter: 'blur(80px)',
          opacity: 0.5,
          animationDelay: '-7s',
        }}
      />
      {/* Gradient sphere 3 - Center */}
      <div 
        className="absolute rounded-full animate-float transition-all duration-1000"
        style={{
          width: '400px',
          height: '400px',
          background: theme.orbs.color3,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(80px)',
          opacity: 0.3,
          animationDelay: '-14s',
        }}
      />
    </div>
  );
});

export default Background;
