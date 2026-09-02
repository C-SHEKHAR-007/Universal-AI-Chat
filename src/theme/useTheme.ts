import { useAppStore } from '../store/appStore';
import { darkColors, lightColors, ColorPalette } from './tokens';

export interface ThemeContextValue {
  theme: 'dark' | 'light';
  isDark: boolean;
  colors: ColorPalette;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export function useTheme(): ThemeContextValue {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return {
    theme,
    isDark,
    colors,
    toggleTheme,
    setTheme,
  };
}
