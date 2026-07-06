// path: components/Navigation/BottomNav.tsx
// Мобильная bottom navigation (скрыта на md+)

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, isActiveLink } from './navItems';

export default function BottomNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.inBottomNav);

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const active = isActiveLink(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                active ? 'text-blue-600' : 'text-gray-500 active:text-gray-700'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
