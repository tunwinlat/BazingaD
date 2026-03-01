export interface Theme {
  id: string;
  name: string;
  colors: {
    background: string;
    backgroundGradient: string;
    surface: string;
    surfaceBorder: string;
    primary: string;
    primaryLight: string;
    text: string;
    textMuted: string;
    accent: string;
  };
}

export const themes: Theme[] = [
  // 1. Default Dark (current)
  {
    id: 'default',
    name: 'Midnight Dark',
    colors: {
      background: '#0f0f1a',
      backgroundGradient: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      surface: 'rgba(255, 255, 255, 0.05)',
      surfaceBorder: 'rgba(255, 255, 255, 0.1)',
      primary: '#6366f1',
      primaryLight: '#818cf8',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.6)',
      accent: '#8b5cf6',
    },
  },
  // 2. Ocean Blue
  {
    id: 'ocean',
    name: 'Ocean Blue',
    colors: {
      background: '#0a192f',
      backgroundGradient: 'linear-gradient(135deg, #0a192f 0%, #112240 50%, #233554 100%)',
      surface: 'rgba(100, 255, 218, 0.05)',
      surfaceBorder: 'rgba(100, 255, 218, 0.1)',
      primary: '#64ffda',
      primaryLight: '#88ffe3',
      text: '#e6f1ff',
      textMuted: 'rgba(230, 241, 255, 0.6)',
      accent: '#00d4aa',
    },
  },
  // 3. Forest Green
  {
    id: 'forest',
    name: 'Forest Green',
    colors: {
      background: '#0d1f0d',
      backgroundGradient: 'linear-gradient(135deg, #0d1f0d 0%, #1a3a1a 50%, #0f2f0f 100%)',
      surface: 'rgba(74, 222, 128, 0.08)',
      surfaceBorder: 'rgba(74, 222, 128, 0.15)',
      primary: '#4ade80',
      primaryLight: '#86efac',
      text: '#f0fdf4',
      textMuted: 'rgba(240, 253, 244, 0.6)',
      accent: '#22c55e',
    },
  },
  // 4. Sunset Orange
  {
    id: 'sunset',
    name: 'Sunset Orange',
    colors: {
      background: '#1a0f0a',
      backgroundGradient: 'linear-gradient(135deg, #1a0f0a 0%, #2d1810 50%, #1f0d08 100%)',
      surface: 'rgba(251, 146, 60, 0.08)',
      surfaceBorder: 'rgba(251, 146, 60, 0.15)',
      primary: '#fb923c',
      primaryLight: '#fdba74',
      text: '#fff7ed',
      textMuted: 'rgba(255, 247, 237, 0.6)',
      accent: '#f97316',
    },
  },
  // 5. Sakura Pink
  {
    id: 'sakura',
    name: 'Sakura Pink',
    colors: {
      background: '#1a0f14',
      backgroundGradient: 'linear-gradient(135deg, #1a0f14 0%, #2d1a22 50%, #1f1418 100%)',
      surface: 'rgba(244, 114, 182, 0.08)',
      surfaceBorder: 'rgba(244, 114, 182, 0.15)',
      primary: '#f472b6',
      primaryLight: '#f9a8d4',
      text: '#fdf2f8',
      textMuted: 'rgba(253, 242, 248, 0.6)',
      accent: '#ec4899',
    },
  },
  // 6. Cyberpunk
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      background: '#0a0a0f',
      backgroundGradient: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a1a 50%, #0f0a1f 100%)',
      surface: 'rgba(255, 0, 255, 0.08)',
      surfaceBorder: 'rgba(255, 0, 255, 0.2)',
      primary: '#ff00ff',
      primaryLight: '#ff44ff',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.6)',
      accent: '#00ffff',
    },
  },
  // 7. Monokai
  {
    id: 'monokai',
    name: 'Monokai',
    colors: {
      background: '#272822',
      backgroundGradient: 'linear-gradient(135deg, #272822 0%, #383830 50%, #2d2d28 100%)',
      surface: 'rgba(174, 129, 255, 0.08)',
      surfaceBorder: 'rgba(174, 129, 255, 0.15)',
      primary: '#ae81ff',
      primaryLight: '#c5a5ff',
      text: '#f8f8f2',
      textMuted: 'rgba(248, 248, 242, 0.6)',
      accent: '#f92672',
    },
  },
  // 8. Dracula
  {
    id: 'dracula',
    name: 'Dracula',
    colors: {
      background: '#282a36',
      backgroundGradient: 'linear-gradient(135deg, #282a36 0%, #44475a 50%, #363846 100%)',
      surface: 'rgba(189, 147, 249, 0.08)',
      surfaceBorder: 'rgba(189, 147, 249, 0.15)',
      primary: '#bd93f9',
      primaryLight: '#d6b8ff',
      text: '#f8f8f2',
      textMuted: 'rgba(248, 248, 242, 0.6)',
      accent: '#ff79c6',
    },
  },
  // 9. Nord
  {
    id: 'nord',
    name: 'Nord',
    colors: {
      background: '#2e3440',
      backgroundGradient: 'linear-gradient(135deg, #2e3440 0%, #3b4252 50%, #434c5e 100%)',
      surface: 'rgba(136, 192, 208, 0.08)',
      surfaceBorder: 'rgba(136, 192, 208, 0.15)',
      primary: '#88c0d0',
      primaryLight: '#a3d6e5',
      text: '#eceff4',
      textMuted: 'rgba(236, 239, 244, 0.6)',
      accent: '#81a1c1',
    },
  },
  // 10. Solarized Dark
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    colors: {
      background: '#002b36',
      backgroundGradient: 'linear-gradient(135deg, #002b36 0%, #073642 50%, #08323c 100%)',
      surface: 'rgba(181, 137, 0, 0.08)',
      surfaceBorder: 'rgba(181, 137, 0, 0.15)',
      primary: '#b58900',
      primaryLight: '#d4a520',
      text: '#fdf6e3',
      textMuted: 'rgba(253, 246, 227, 0.6)',
      accent: '#268bd2',
    },
  },
  // 11. Gruvbox Dark
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    colors: {
      background: '#282828',
      backgroundGradient: 'linear-gradient(135deg, #282828 0%, #3c3836 50%, #32302f 100%)',
      surface: 'rgba(215, 153, 33, 0.08)',
      surfaceBorder: 'rgba(215, 153, 33, 0.15)',
      primary: '#d79921',
      primaryLight: '#fabd2f',
      text: '#ebdbb2',
      textMuted: 'rgba(235, 219, 178, 0.6)',
      accent: '#b8bb26',
    },
  },
  // 12. Tokyo Night
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    colors: {
      background: '#1a1b26',
      backgroundGradient: 'linear-gradient(135deg, #1a1b26 0%, #24283b 50%, #1f2335 100%)',
      surface: 'rgba(122, 162, 247, 0.08)',
      surfaceBorder: 'rgba(122, 162, 247, 0.15)',
      primary: '#7aa2f7',
      primaryLight: '#9ab8ff',
      text: '#a9b1d6',
      textMuted: 'rgba(169, 177, 214, 0.6)',
      accent: '#bb9af7',
    },
  },
  // 13. One Dark
  {
    id: 'one-dark',
    name: 'One Dark',
    colors: {
      background: '#282c34',
      backgroundGradient: 'linear-gradient(135deg, #282c34 0%, #353b45 50%, #2c313a 100%)',
      surface: 'rgba(97, 175, 239, 0.08)',
      surfaceBorder: 'rgba(97, 175, 239, 0.15)',
      primary: '#61afef',
      primaryLight: '#8dc3f3',
      text: '#abb2bf',
      textMuted: 'rgba(171, 178, 191, 0.6)',
      accent: '#c678dd',
    },
  },
  // 14. Catppuccin Mocha
  {
    id: 'catppuccin',
    name: 'Catppuccin Mocha',
    colors: {
      background: '#1e1e2e',
      backgroundGradient: 'linear-gradient(135deg, #1e1e2e 0%, #302d41 50%, #252236 100%)',
      surface: 'rgba(203, 166, 247, 0.08)',
      surfaceBorder: 'rgba(203, 166, 247, 0.15)',
      primary: '#cba6f7',
      primaryLight: '#ddbdf9',
      text: '#cdd6f4',
      textMuted: 'rgba(205, 214, 244, 0.6)',
      accent: '#f38ba8',
    },
  },
  // 15. Rose Pine
  {
    id: 'rose-pine',
    name: 'Rosé Pine',
    colors: {
      background: '#191724',
      backgroundGradient: 'linear-gradient(135deg, #191724 0%, #1f1d2e 50%, #1a1823 100%)',
      surface: 'rgba(235, 188, 186, 0.08)',
      surfaceBorder: 'rgba(235, 188, 186, 0.15)',
      primary: '#ebbcba',
      primaryLight: '#f5d6d4',
      text: '#e0def4',
      textMuted: 'rgba(224, 222, 244, 0.6)',
      accent: '#c4a7e7',
    },
  },
  // 16. Material Dark
  {
    id: 'material-dark',
    name: 'Material Dark',
    colors: {
      background: '#121212',
      backgroundGradient: 'linear-gradient(135deg, #121212 0%, #1e1e1e 50%, #181818 100%)',
      surface: 'rgba(187, 134, 252, 0.08)',
      surfaceBorder: 'rgba(187, 134, 252, 0.15)',
      primary: '#bb86fc',
      primaryLight: '#d4b5ff',
      text: '#e0e0e0',
      textMuted: 'rgba(224, 224, 224, 0.6)',
      accent: '#03dac6',
    },
  },
  // 17. High Contrast
  {
    id: 'high-contrast',
    name: 'High Contrast',
    colors: {
      background: '#000000',
      backgroundGradient: 'linear-gradient(135deg, #000000 0%, #111111 50%, #080808 100%)',
      surface: 'rgba(255, 255, 255, 0.1)',
      surfaceBorder: 'rgba(255, 255, 255, 0.3)',
      primary: '#ffffff',
      primaryLight: '#cccccc',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.7)',
      accent: '#ffff00',
    },
  },
  // 18. Coffee
  {
    id: 'coffee',
    name: 'Coffee',
    colors: {
      background: '#1a1410',
      backgroundGradient: 'linear-gradient(135deg, #1a1410 0%, #2d2018 50%, #231a14 100%)',
      surface: 'rgba(200, 162, 124, 0.08)',
      surfaceBorder: 'rgba(200, 162, 124, 0.15)',
      primary: '#c8a27c',
      primaryLight: '#dcc0a8',
      text: '#f5ebe0',
      textMuted: 'rgba(245, 235, 224, 0.6)',
      accent: '#a67c52',
    },
  },
  // 19. Lavender
  {
    id: 'lavender',
    name: 'Lavender',
    colors: {
      background: '#1a1a2e',
      backgroundGradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 50%, #222236 100%)',
      surface: 'rgba(180, 160, 220, 0.08)',
      surfaceBorder: 'rgba(180, 160, 220, 0.15)',
      primary: '#b4a0dc',
      primaryLight: '#d4c4f0',
      text: '#e6e6fa',
      textMuted: 'rgba(230, 230, 250, 0.6)',
      accent: '#9b7ed4',
    },
  },
  // 20. Crimson
  {
    id: 'crimson',
    name: 'Crimson',
    colors: {
      background: '#1a0a0f',
      backgroundGradient: 'linear-gradient(135deg, #1a0a0f 0%, #2d141c 50%, #1f0f14 100%)',
      surface: 'rgba(220, 68, 92, 0.08)',
      surfaceBorder: 'rgba(220, 68, 92, 0.15)',
      primary: '#dc445c',
      primaryLight: '#e87084',
      text: '#fff0f3',
      textMuted: 'rgba(255, 240, 243, 0.6)',
      accent: '#ff1744',
    },
  },
];

export const defaultTheme = themes[0];

export function getThemeById(id: string): Theme {
  return themes.find((t) => t.id === id) || defaultTheme;
}
