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

export interface DeveloperSocialLink {
  id: string;
  label: string;
  displayValue: string;
  url: string;
  brandColor: string;
  bgLightColor: string;
}

export const DEVELOPER_CONFIG = {
  NAME: 'Chandra Shekhar Chaudhary',
  INITIALS: 'CSC',
  ROLE: 'Creator & Lead Developer',
  BIO: 'Building modern, privacy-first AI workstations, cross-platform applications, and intelligent systems.',
  EMAIL: 'c.shekhar.c101@gmail.com',
  PHONE: '+91 9807084494',
  WHATSAPP: '+91 9807084494',
  LINKEDIN_URL: 'https://www.linkedin.com/in/chandra-shekhar-chaudhary',
  GITHUB_URL: 'https://github.com/C-SHEKHAR-007',
  PORTFOLIO_URL: 'https://c-shekhar-007.github.io/portfolio/',
  SOCIAL_LINKS: [
    {
      id: 'email',
      label: 'Email',
      displayValue: 'c.shekhar.c101@gmail.com',
      url: 'mailto:c.shekhar.c101@gmail.com',
      brandColor: '#EA4335',
      bgLightColor: 'rgba(234, 67, 53, 0.12)',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      displayValue: '+91 9807084494',
      url: 'https://wa.me/919807084494?text=Hi%20Chandra%20Shekhar,%20I%20contacted%20you%20via%20Universal%20AI%20Chat',
      brandColor: '#25D366',
      bgLightColor: 'rgba(37, 211, 102, 0.12)',
    },
    {
      id: 'contact',
      label: 'Contact',
      displayValue: '+91 9807084494',
      url: 'tel:+919807084494',
      brandColor: '#0EA5E9',
      bgLightColor: 'rgba(14, 165, 233, 0.12)',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      displayValue: 'linkedin.com/in/chandra-shekhar-chaudhary',
      url: 'https://www.linkedin.com/in/chandra-shekhar-chaudhary',
      brandColor: '#0A66C2',
      bgLightColor: 'rgba(10, 102, 194, 0.12)',
    },
    {
      id: 'github',
      label: 'GitHub',
      displayValue: 'github.com/C-SHEKHAR-007',
      url: 'https://github.com/C-SHEKHAR-007',
      brandColor: '#24292F',
      bgLightColor: 'rgba(0, 0, 0, 0.08)',
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      displayValue: 'c-shekhar-007.github.io/portfolio',
      url: 'https://c-shekhar-007.github.io/portfolio/',
      brandColor: '#8B5CF6',
      bgLightColor: 'rgba(139, 92, 246, 0.12)',
    },
  ] as DeveloperSocialLink[],
} as const;

