import { ActiveTab } from '../types';

export const APP_NAME = 'Universal AI';
export const APP_VERSION = '1.0.0';
export const APP_SUBTITLE = 'Version 1.0.0 (Expo SDK 52)';
export const DEFAULT_THEME: 'dark' | 'light' = 'dark';
export const DEFAULT_ACTIVE_TAB: ActiveTab = 'chat';
export const TOAST_DURATION_MS = 3000;

export interface NavigationTabConfig {
  key: ActiveTab;
  label: string;
}

export const NAVIGATION_TABS: NavigationTabConfig[] = [
  { key: 'chat', label: 'Chat' },
  { key: 'conversations', label: 'Conversations' },
  { key: 'models', label: 'Providers' },
  { key: 'performance', label: 'Performance' },
  { key: 'settings', label: 'Settings' },
];
