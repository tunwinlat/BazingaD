'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  // Apply theme CSS variables
  const applyTheme = (theme: Theme) => {
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
  };

  // Fetch theme from settings
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const response = await fetch('/api/settings/general');
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
        setIsLoading(false);
      }
    };

    fetchTheme();
  }, []);

  const setTheme = (themeId: string) => {
    const newTheme = getThemeById(themeId);
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}
