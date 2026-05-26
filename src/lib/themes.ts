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
  // Animated background orbs for the Background component
  orbs: {
    color1: string; // Top right orb
    color2: string; // Bottom left orb
    color3: string; // Center orb
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
    orbs: {
      color1: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
      color2: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #10b981 100%)',
      color3: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #00d4aa 0%, #00a8e8 50%, #0077b6 100%)',
      color2: 'linear-gradient(135deg, #023e8a 0%, #0096c7 50%, #48cae4 100%)',
      color3: 'linear-gradient(135deg, #64ffda 0%, #00b4d8 50%, #90e0ef 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
      color2: 'linear-gradient(135deg, #4ade80 0%, #84cc16 50%, #65a30d 100%)',
      color3: 'linear-gradient(135deg, #86efac 0%, #22d3ee 50%, #34d399 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)',
      color2: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #f59e0b 100%)',
      color3: 'linear-gradient(135deg, #fde047 0%, #fdba74 50%, #fca5a5 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #f9a8d4 100%)',
      color2: 'linear-gradient(135deg, #db2777 0%, #e879f9 50%, #c084fc 100%)',
      color3: 'linear-gradient(135deg, #fbcfe8 0%, #fce7f3 50%, #fdf2f8 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #ff00ff 0%, #ff1493 50%, #ff0080 100%)',
      color2: 'linear-gradient(135deg, #00ffff 0%, #0099ff 50%, #6600ff 100%)',
      color3: 'linear-gradient(135deg, #ffff00 0%, #ff00ff 50%, #00ffff 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #f92672 0%, #fd971f 50%, #f4bf75 100%)',
      color2: 'linear-gradient(135deg, #a6e22e 0%, #66d9ef 50%, #ae81ff 100%)',
      color3: 'linear-gradient(135deg, #f8f8f0 0%, #75715e 50%, #49483e 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #bd93f9 0%, #ff79c6 50%, #ff5555 100%)',
      color2: 'linear-gradient(135deg, #8be9fd 0%, #50fa7b 50%, #f1fa8c 100%)',
      color3: 'linear-gradient(135deg, #ffb86c 0%, #ff79c6 50%, #bd93f9 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #88c0d0 0%, #81a1c1 50%, #5e81ac 100%)',
      color2: 'linear-gradient(135deg, #bf616a 0%, #d08770 50%, #ebcb8b 100%)',
      color3: 'linear-gradient(135deg, #a3be8c 0%, #b48ead 50%, #8fbcbb 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #b58900 0%, #cb4b16 50%, #dc322f 100%)',
      color2: 'linear-gradient(135deg, #268bd2 0%, #2aa198 50%, #859900 100%)',
      color3: 'linear-gradient(135deg, #d33682 0%, #6c71c4 50%, #93a1a1 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #fb4934 0%, #fe8019 50%, #fabd2f 100%)',
      color2: 'linear-gradient(135deg, #b8bb26 0%, #8ec07c 50%, #83a598 100%)',
      color3: 'linear-gradient(135deg, #d3869b 0%, #b16286 50%, #cc241d 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #7aa2f7 0%, #bb9af7 50%, #c0caf5 100%)',
      color2: 'linear-gradient(135deg, #ff9e64 0%, #e0af68 50%, #9ece6a 100%)',
      color3: 'linear-gradient(135deg, #f7768e 0%, #ff007c 50%, #7aa2f7 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #61afef 0%, #c678dd 50%, #e06c75 100%)',
      color2: 'linear-gradient(135deg, #98c379 0%, #e5c07b 50%, #d19a66 100%)',
      color3: 'linear-gradient(135deg, #56b6c2 0%, #abb2bf 50%, #828997 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #cba6f7 0%, #f38ba8 50%, #fab387 100%)',
      color2: 'linear-gradient(135deg, #89dceb 0%, #94e2d5 50%, #a6e3a1 100%)',
      color3: 'linear-gradient(135deg, #f9e2af 0%, #eba0ac 50%, #cba6f7 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #ebbcba 0%, #f6c177 50%, #ea9a97 100%)',
      color2: 'linear-gradient(135deg, #c4a7e7 0%, #9ccfd8 50%, #3e8fb0 100%)',
      color3: 'linear-gradient(135deg, #f6c177 0%, #d7827e 50%, #b4637a 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #bb86fc 0%, #6200ee 50%, #3700b3 100%)',
      color2: 'linear-gradient(135deg, #03dac6 0%, #018786 50%, #03dac6 100%)',
      color3: 'linear-gradient(135deg, #cf6679 0%, #bb86fc 50%, #03dac6 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #ffffff 0%, #cccccc 50%, #999999 100%)',
      color2: 'linear-gradient(135deg, #ffff00 0%, #ffffff 50%, #ffff00 100%)',
      color3: 'linear-gradient(135deg, #ff0000 0%, #ffff00 50%, #00ff00 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #c8a27c 0%, #a67c52 50%, #8b6239 100%)',
      color2: 'linear-gradient(135deg, #d4a574 0%, #e8d5b7 50%, #c9a86c 100%)',
      color3: 'linear-gradient(135deg, #6f4e37 0%, #8b6914 50%, #a0522d 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #b4a0dc 0%, #9b7ed4 50%, #7b68ee 100%)',
      color2: 'linear-gradient(135deg, #dda0dd 0%, #da70d6 50%, #ba55d3 100%)',
      color3: 'linear-gradient(135deg, #e6e6fa 0%, #d8bfd8 50%, #dDA0dd 100%)',
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
    orbs: {
      color1: 'linear-gradient(135deg, #dc445c 0%, #ff1744 50%, #ff6b6b 100%)',
      color2: 'linear-gradient(135deg, #ff6b6b 0%, #ffa07a 50%, #ff8a80 100%)',
      color3: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 50%, #f44336 100%)',
    },
  },
];

export const defaultTheme = themes[0];

export function getThemeById(id: string): Theme {
  return themes.find((t) => t.id === id) || defaultTheme;
}
