'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { themes, getThemeById, Theme } from '@/lib/themes';

interface ThemeContextType {
  theme: Theme;
  setTheme: (themeId: string) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(themes[0]);
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme CSS variables - memoized to prevent recalculation
  const applyTheme = useCallback((theme: Theme) => {
    const root = document.documentElement;
    
    root.style.setProperty('--theme-background', theme.colors.background);
    root.style.setProperty('--theme-background-gradient', theme.colors.backgroundGradient);
    root.style.setProperty('--theme-surface', theme.colors.surface);
    root.style.setProperty('--theme-surface-border', theme.colors.surfaceBorder);
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-primary-light', theme.colors.primaryLight);
    root.style.setProperty('--theme-text', theme.colors.text);
    root.style.setProperty('--theme-text-muted', theme.colors.textMuted);
    root.style.setProperty('--theme-accent', theme.colors.accent);
    
    // Apply background gradient to body
    document.body.style.background = theme.colors.backgroundGradient;
  }, []);

  // Fetch theme from settings - only on mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchTheme = async () => {
      try {
        const response = await fetch('/api/settings/general', {
          // Add cache headers to prevent unnecessary refetches
          headers: {
            'Cache-Control': 'max-age=60',
          },
        });
        
        if (!isMounted) return;
        
        if (response.ok) {
          const data = await response.json();
          const themeId = data.theme || 'default';
          const selectedTheme = getThemeById(themeId);
          setThemeState(selectedTheme);
          applyTheme(selectedTheme);
        }
      } catch (error) {
        console.error('Failed to fetch theme:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTheme();
    
    return () => {
      isMounted = false;
    };
  }, [applyTheme]);

  const setTheme = useCallback((themeId: string) => {
    const newTheme = getThemeById(themeId);
    setThemeState(newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    theme,
    setTheme,
    isLoading,
  }), [theme, setTheme, isLoading]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
