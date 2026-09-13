export const BREAKPOINTS = {
  PHONE: 600,
  TABLET_MIN: 600,
  SIDEBAR_MIN: 768,
  TABLET_PORTRAIT_MAX: 900,
  TABLET_MAX: 1024,
} as const;

export const DRAWER_CONFIG = {
  MAX_WIDTH: 320,
  WIDTH_RATIO: 0.8,
} as const;

export const TOOLTIP_CONFIG = {
  DEFAULT_DELAY_MS: 1000,
} as const;

export const POPOVER_CONFIG = {
  WIDTH: 280,
  BOTTOM_OFFSET: 36,
  Z_INDEX: 9999,
  BACKDROP_Z_INDEX: 9998,
} as const;

export const SIDEBAR_CONFIG = {
  DEFAULT_WIDTH: 280,
  MIN_WIDTH: 220,
  MAX_WIDTH: 520,
  COLLAPSED_WIDTH: 60,
} as const;
