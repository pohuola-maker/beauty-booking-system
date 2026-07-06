// path: components/Navigation/navItems.tsx
// Единый конфиг навигации: используется в SidebarNav, BottomNav и mobile drawer

import type { ReactNode } from 'react';

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** показывать в мобильной bottom nav (максимум 4) */
  inBottomNav: boolean;
}

const iconClass = 'h-6 w-6 shrink-0';

const icons = {
  dashboard: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" />
    </svg>
  ),
  calendar: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M8 3v4m8-4v4M3 10h18" />
    </svg>
  ),
  clients: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" />
      <path strokeLinecap="round" d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5M16 5.5a3 3 0 010 5.5m2.5 9c-.3-1.9-1.2-3.4-2.5-4.4" />
    </svg>
  ),
  finances: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" d="M4 20V10m5.5 10V4m5.5 16v-7M20.5 20V7" />
    </svg>
  ),
  services: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.9 2.4L22 18.5l-2.1 1.1L19 22l-.9-2.4-2.1-1.1 2.1-1.1L19 15z" />
    </svg>
  ),
  settings: (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.2a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3h.1a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.2a1.7 1.7 0 001 1.5h.1a1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9v.1a1.7 1.7 0 001.5 1h.2a2 2 0 110 4h-.2a1.7 1.7 0 00-1.5 1z" />
    </svg>
  ),
};

export const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: icons.dashboard, inBottomNav: true },
  { href: '/admin/calendar', label: 'Календарь', icon: icons.calendar, inBottomNav: true },
  { href: '/admin/clients', label: 'Клиенты', icon: icons.clients, inBottomNav: true },
  { href: '/admin/finances', label: 'Финансы', icon: icons.finances, inBottomNav: true },
  { href: '/admin/services', label: 'Услуги', icon: icons.services, inBottomNav: false },
  { href: '/admin/settings', label: 'Настройки', icon: icons.settings, inBottomNav: false },
];

/** Активна ли ссылка (точное совпадение для /admin, prefix для остальных) */
export function isActiveLink(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(href + '/');
}
