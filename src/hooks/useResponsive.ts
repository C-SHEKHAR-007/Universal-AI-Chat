import { useWindowDimensions } from 'react-native';
import { ScreenBreakpoint } from '../types';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isPhone: boolean;
  isTablet: boolean;
  isLargeTablet: boolean;
  isMasterDetailSupported: boolean;
  breakpoint: ScreenBreakpoint;
  drawerWidth: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  
  const isPortrait = height >= width;
  const isLandscape = !isPortrait;
  const minDim = Math.min(width, height);
  
  const isPhone = width < 600 || (isLandscape && width < 768);
  const isTablet = width >= 600 && width < 1024;
  const isLargeTablet = width >= 1024;
  
  // Tablet landscape supports dual-pane persistent sidebar
  const isMasterDetailSupported = width >= 768;

  let breakpoint: ScreenBreakpoint = 'phone_portrait';
  if (width < 600) {
    breakpoint = isPortrait ? 'phone_portrait' : 'phone_landscape';
  } else if (width < 900) {
    breakpoint = isPortrait ? 'tablet_portrait' : 'tablet_landscape';
  } else {
    breakpoint = 'tablet_landscape';
  }

  const drawerWidth = Math.min(320, width * 0.8);

  return {
    width,
    height,
    isPortrait,
    isLandscape,
    isPhone,
    isTablet,
    isLargeTablet,
    isMasterDetailSupported,
    breakpoint,
    drawerWidth,
  };
}
