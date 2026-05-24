import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemePreset {
  id: string;
  name: string;
  bg: string;
  primary: string;
  secondary: string;
  ambient1: string;
  ambient2: string;
  glassBg: string;
  glassBorder: string;
  isDark: boolean;
}

export type AnimationIntensity = 'none' | 'slow' | 'normal' | 'high';
export type SizingDensity = 'compact' | 'normal' | 'spacious';

export interface AccentColorPreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'cinematic-midnight',
    name: 'Cinematic Midnight',
    bg: '#040408',
    primary: '#8b5cf6', // Violet
    secondary: '#6366f1', // Indigo
    ambient1: 'rgba(139, 92, 246, 0.18)',
    ambient2: 'rgba(99, 102, 241, 0.14)',
    glassBg: 'rgba(255, 255, 255, 0.03)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    isDark: true
  },
  {
    id: 'space',
    name: 'Cosmic Space',
    bg: '#02020a',
    primary: '#06b6d4', // Cyan
    secondary: '#3b82f6', // Blue
    ambient1: 'rgba(6, 182, 212, 0.16)',
    ambient2: 'rgba(59, 130, 246, 0.12)',
    glassBg: 'rgba(255, 255, 255, 0.02)',
    glassBorder: 'rgba(255, 255, 255, 0.06)',
    isDark: true
  },
  {
    id: 'ocean',
    name: 'Abyssal Ocean',
    bg: '#020b10',
    primary: '#14b8a6', // Teal
    secondary: '#0ea5e9', // Sky Blue
    ambient1: 'rgba(20, 184, 166, 0.15)',
    ambient2: 'rgba(14, 165, 233, 0.15)',
    glassBg: 'rgba(255, 255, 255, 0.02)',
    glassBorder: 'rgba(255, 255, 255, 0.05)',
    isDark: true
  },
  {
    id: 'forest',
    name: 'Misty Forest',
    bg: '#030805',
    primary: '#10b981', // Emerald
    secondary: '#84cc16', // Lime
    ambient1: 'rgba(16, 185, 129, 0.14)',
    ambient2: 'rgba(132, 204, 22, 0.10)',
    glassBg: 'rgba(255, 255, 255, 0.02)',
    glassBorder: 'rgba(255, 255, 255, 0.05)',
    isDark: true
  },
  {
    id: 'sunset',
    name: 'Aegean Sunset',
    bg: '#0a0305',
    primary: '#f43f5e', // Rose
    secondary: '#f97316', // Orange
    ambient1: 'rgba(244, 63, 94, 0.15)',
    ambient2: 'rgba(249, 115, 22, 0.12)',
    glassBg: 'rgba(255, 255, 255, 0.03)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    isDark: true
  },
  {
    id: 'cricket',
    name: 'Cricket Echo',
    bg: '#050703',
    primary: '#a3e635', // Yellow green
    secondary: '#eab308', // Gold
    ambient1: 'rgba(163, 230, 53, 0.12)',
    ambient2: 'rgba(234, 179, 8, 0.10)',
    glassBg: 'rgba(255, 255, 255, 0.02)',
    glassBorder: 'rgba(255, 255, 255, 0.06)',
    isDark: true
  }
];

export const ACCENT_COLOR_PRESETS: AccentColorPreset[] = [
  { id: 'default', name: 'Theme Native', primary: '', secondary: '' },
  { id: 'neon-violet', name: 'Luminous Violet', primary: '#a78bfa', secondary: '#c084fc' },
  { id: 'sky-blue', name: 'Ocean Mist', primary: '#38bdf8', secondary: '#60a5fa' },
  { id: 'magic-emerald', name: 'Emerald Aura', primary: '#34d399', secondary: '#4ade80' },
  { id: 'amber-glow', name: 'Solar Flare', primary: '#fbbf24', secondary: '#fb923c' },
  { id: 'quantum-rose', name: 'Siren Pink', primary: '#f472b6', secondary: '#fb7185' }
];

interface SettingsContextType {
  activeThemeId: string;
  setTheme: (themeId: string) => void;
  activeAccentId: string;
  setAccentColor: (accentId: string) => void;
  animationIntensity: AnimationIntensity;
  setAnimationIntensity: (intensity: AnimationIntensity) => void;
  density: SizingDensity;
  setDensity: (density: SizingDensity) => void;
  backgroundImage: string | null;
  setBackgroundImage: (img: string | null) => void;
  bgOpacity: number; // 0 - 100
  setBgOpacity: (opacity: number) => void;
  removeBackground: () => void;
  
  // Custom theme specs
  currentThemeSpec: ThemePreset;
  currentAccentSpec: AccentColorPreset;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeThemeId, setActiveThemeIdState] = useState(() => {
    return localStorage.getItem('studyvibe_settings_theme') || 'cinematic-midnight';
  });

  const [activeAccentId, setActiveAccentIdState] = useState(() => {
    return localStorage.getItem('studyvibe_settings_accent') || 'default';
  });

  const [animationIntensity, setAnimationIntensityState] = useState<AnimationIntensity>(() => {
    return (localStorage.getItem('studyvibe_settings_animations') as AnimationIntensity) || 'normal';
  });

  const [density, setDensityState] = useState<SizingDensity>(() => {
    return (localStorage.getItem('studyvibe_settings_density') as SizingDensity) || 'normal';
  });

  const [backgroundImage, setBackgroundImageState] = useState<string | null>(() => {
    return localStorage.getItem('studyvibe_settings_bg_image') || null;
  });

  const [bgOpacity, setBgOpacityState] = useState<number>(() => {
    const val = localStorage.getItem('studyvibe_settings_bg_opacity');
    return val !== null ? parseInt(val, 10) : 40;
  });

  const currentThemeSpec = THEME_PRESETS.find(t => t.id === activeThemeId) || THEME_PRESETS[0];
  const currentAccentSpec = ACCENT_COLOR_PRESETS.find(a => a.id === activeAccentId) || ACCENT_COLOR_PRESETS[0];

  const setTheme = (id: string) => {
    if (THEME_PRESETS.some(t => t.id === id)) {
      setActiveThemeIdState(id);
      localStorage.setItem('studyvibe_settings_theme', id);
    }
  };

  const setAccentColor = (id: string) => {
    if (ACCENT_COLOR_PRESETS.some(a => a.id === id)) {
      setActiveAccentIdState(id);
      localStorage.setItem('studyvibe_settings_accent', id);
    }
  };

  const setAnimationIntensity = (val: AnimationIntensity) => {
    setAnimationIntensityState(val);
    localStorage.setItem('studyvibe_settings_animations', val);
  };

  const setDensity = (val: SizingDensity) => {
    setDensityState(val);
    localStorage.setItem('studyvibe_settings_density', val);
  };

  const setBackgroundImage = (val: string | null) => {
    setBackgroundImageState(val);
    if (val === null) {
      localStorage.removeItem('studyvibe_settings_bg_image');
    } else {
      localStorage.setItem('studyvibe_settings_bg_image', val);
    }
  };

  const setBgOpacity = (val: number) => {
    const lim = Math.max(0, Math.min(100, val));
    setBgOpacityState(lim);
    localStorage.setItem('studyvibe_settings_bg_opacity', lim.toString());
  };

  const removeBackground = () => {
    setBackgroundImage(null);
  };

  // Dynamically inject CSS customized styling properties representing state parameters instantly!
  useEffect(() => {
    const root = document.documentElement;

    // Apply basic layout values
    root.style.setProperty('--theme-bg', currentThemeSpec.bg);
    root.style.setProperty('--theme-ambient-1', currentThemeSpec.ambient1);
    root.style.setProperty('--theme-ambient-2', currentThemeSpec.ambient2);

    // Apply primary/secondary accent selections
    const primaryColor = currentAccentSpec.primary || currentThemeSpec.primary;
    const secondaryColor = currentAccentSpec.secondary || currentThemeSpec.secondary;

    root.style.setProperty('--brand-purple', primaryColor);
    root.style.setProperty('--brand-indigo', secondaryColor);
    
    // Core Tailwind overrides for direct visual bindings
    root.style.setProperty('--color-brand-purple', primaryColor);
    root.style.setProperty('--color-brand-indigo', secondaryColor);

    // Compute glass backgrounds based on customized opacity
    const baseGlassAlpha = bgOpacity / 1000; // e.g. 40 opacity -> 0.04
    root.style.setProperty('--glass-bg', `rgba(255, 255, 255, ${baseGlassAlpha})`);
    root.style.setProperty('--color-glass-bg', `rgba(255, 255, 255, ${baseGlassAlpha})`);
    root.style.setProperty('--glass-border', `rgba(255, 255, 255, ${baseGlassAlpha + 0.05})`);
    root.style.setProperty('--color-glass-border', `rgba(255, 255, 255, ${baseGlassAlpha + 0.05})`);

    // Dense adjustments scale factors
    if (density === 'compact') {
      root.style.setProperty('--density-padding', '12px');
      root.style.setProperty('--density-gap', '8px');
      document.body.classList.add('layout-compact');
      document.body.classList.remove('layout-normal', 'layout-spacious');
    } else if (density === 'spacious') {
      root.style.setProperty('--density-padding', '24px');
      root.style.setProperty('--density-gap', '24px');
      document.body.classList.add('layout-spacious');
      document.body.classList.remove('layout-normal', 'layout-compact');
    } else {
      root.style.setProperty('--density-padding', '18px');
      root.style.setProperty('--density-gap', '16px');
      document.body.classList.add('layout-normal');
      document.body.classList.remove('layout-compact', 'layout-spacious');
    }

    // Custom loaded wallpapers values
    if (backgroundImage) {
      root.style.setProperty('--custom-wall-url', `url("${backgroundImage}")`);
      root.style.setProperty('--custom-wall-opacity', `${bgOpacity / 100}`);
      document.body.classList.add('has-custom-wallpaper');
    } else {
      root.style.setProperty('--custom-wall-url', 'none');
      root.style.setProperty('--custom-wall-opacity', '0');
      document.body.classList.remove('has-custom-wallpaper');
    }

    // Animation factor
    let animationScale = '1';
    if (animationIntensity === 'none') animationScale = '0';
    if (animationIntensity === 'slow') animationScale = '1.7';
    if (animationIntensity === 'high') animationScale = '0.5'; // faster duration
    root.style.setProperty('--animation-scale-factor', animationScale);

  }, [activeThemeId, activeAccentId, animationIntensity, density, backgroundImage, bgOpacity]);

  return (
    <SettingsContext.Provider value={{
      activeThemeId,
      setTheme,
      activeAccentId,
      setAccentColor,
      animationIntensity,
      setAnimationIntensity,
      density,
      setDensity,
      backgroundImage,
      setBackgroundImage,
      bgOpacity,
      setBgOpacity,
      removeBackground,
      currentThemeSpec,
      currentAccentSpec
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
