import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { ScreenBreakpoint } from '../types';
import { BREAKPOINTS, DRAWER_CONFIG } from '../constants';

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

  return useMemo(() => {
    const isPortrait = height >= width;
    const isLandscape = !isPortrait;
    
    const isPhone = width < BREAKPOINTS.PHONE || (isLandscape && width < BREAKPOINTS.SIDEBAR_MIN);
    const isTablet = width >= BREAKPOINTS.TABLET_MIN && width < BREAKPOINTS.TABLET_MAX;
    const isLargeTablet = width >= BREAKPOINTS.TABLET_MAX;
    
    // Tablet landscape supports dual-pane persistent sidebar
    const isMasterDetailSupported = width >= BREAKPOINTS.SIDEBAR_MIN;

    let breakpoint: ScreenBreakpoint = 'phone_portrait';
    if (width < BREAKPOINTS.PHONE) {
      breakpoint = isPortrait ? 'phone_portrait' : 'phone_landscape';
    } else if (width < BREAKPOINTS.TABLET_PORTRAIT_MAX) {
      breakpoint = isPortrait ? 'tablet_portrait' : 'tablet_landscape';
    } else {
      breakpoint = 'tablet_landscape';
    }

    const drawerWidth = Math.min(DRAWER_CONFIG.MAX_WIDTH, width * DRAWER_CONFIG.WIDTH_RATIO);

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
  }, [width, height]);
}
