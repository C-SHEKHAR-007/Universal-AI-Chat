export interface ColorPalette {
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  card: string;
  cardHover: string;
  cardActive: string;
  
  border: string;
  borderLight: string;
  borderHighlight: string;
  
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  primary: string;
  primaryHover: string;
  primaryMuted: string;
  
  success: string;
  successLight: string;
  successMuted: string;
  
  warning: string;
  warningLight: string;
  warningMuted: string;
  
  danger: string;
  dangerLight: string;
  dangerMuted: string;
  
  purple: string;
  purpleLight: string;
  
  // User bubble vs AI
  userBubble: string;
  userBubbleBorder: string;
  userBubbleText: string;
  assistantSurface: string;
  
  // Code Block Surface
  codeBg: string;
  codeBorder: string;
  codeHeader: string;
  codeText: string;
  
  overlay: string;
}

export const darkColors: ColorPalette = {
  background: '#0d1117',
  backgroundSecondary: '#161b22',
  backgroundTertiary: '#21262d',
  card: '#161b22',
  cardHover: '#1c2128',
  cardActive: '#262c36',
  
  border: '#30363d',
  borderLight: '#21262d',
  borderHighlight: '#388bfd',
  
  textPrimary: '#f0f6fc',
  textSecondary: '#8b949e',
  textMuted: '#6e7681',
  textInverse: '#0d1117',
  
  primary: '#388bfd',
  primaryHover: '#58a6ff',
  primaryMuted: 'rgba(56, 139, 253, 0.15)',
  
  success: '#2ea043',
  successLight: 'rgba(46, 160, 67, 0.15)',
  successMuted: 'rgba(46, 160, 67, 0.15)',
  
  warning: '#d29922',
  warningLight: 'rgba(210, 153, 34, 0.15)',
  warningMuted: 'rgba(210, 153, 34, 0.15)',
  
  danger: '#f85149',
  dangerLight: 'rgba(248, 81, 73, 0.15)',
  dangerMuted: 'rgba(248, 81, 73, 0.15)',
  
  purple: '#a371f7',
  purpleLight: 'rgba(163, 113, 247, 0.15)',
  
  userBubble: '#1f293d',
  userBubbleBorder: '#2d3748',
  userBubbleText: '#f0f6fc',
  assistantSurface: '#0d1117',
  
  codeBg: '#090d13',
  codeBorder: '#21262d',
  codeHeader: '#161b22',
  codeText: '#e6edf3',
  
  overlay: 'rgba(0, 0, 0, 0.75)',
};

export const lightColors: ColorPalette = {
  background: '#ffffff',
  backgroundSecondary: '#f6f8fa',
  backgroundTertiary: '#eaedf1',
  card: '#ffffff',
  cardHover: '#f3f4f6',
  cardActive: '#e5e7eb',
  
  border: '#d0d7de',
  borderLight: '#e1e4e8',
  borderHighlight: '#0969da',
  
  textPrimary: '#1f2328',
  textSecondary: '#59636e',
  textMuted: '#8c959f',
  textInverse: '#ffffff',
  
  primary: '#0969da',
  primaryHover: '#0550ae',
  primaryMuted: 'rgba(9, 105, 218, 0.12)',
  
  success: '#1a7f37',
  successLight: 'rgba(26, 127, 55, 0.12)',
  successMuted: 'rgba(26, 127, 55, 0.12)',
  
  warning: '#9a6700',
  warningLight: 'rgba(154, 103, 0, 0.12)',
  warningMuted: 'rgba(154, 103, 0, 0.12)',
  
  danger: '#cf222e',
  dangerLight: 'rgba(207, 34, 46, 0.12)',
  dangerMuted: 'rgba(207, 34, 46, 0.12)',
  
  purple: '#8250df',
  purpleLight: 'rgba(130, 80, 223, 0.12)',
  
  userBubble: '#e8f0fe',
  userBubbleBorder: '#cce0ff',
  userBubbleText: '#041e49',
  assistantSurface: '#ffffff',
  
  codeBg: '#f6f8fa',
  codeBorder: '#d0d7de',
  codeHeader: '#eaeef2',
  codeText: '#1f2328',
  
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Default fallback colors
export const colors = darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const typography = {
  fontFamily: 'System',
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
