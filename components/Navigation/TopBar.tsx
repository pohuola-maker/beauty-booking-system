// path: components/Navigation/TopBar.tsx
// Верхняя панель: hamburger (mobile), название салона, профиль с logout

'use client';

import { useState, useRef, useEffect } from 'react';

interface TopBarUser {
  name: string;
  email: string;
}

interface TopBarProps {
  user: TopBarUser;
  onMenuClick: () => void;
  onLogout: () => void;
  menuOpen: boolean;
}

export default function TopBar({ user, onMenuClick, onLogout, menuOpen }: TopBarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // закрытие dropdown по клику вне и по Escape
  useEffect(() => {
    if (!profileOpen) return;

    function onClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setProfileOpen(false);
    }

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [profileOpen]);

  const initial = user.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-3 md:px-6">
      <div className="flex items-center gap-2">
        {/* hamburger — только mobile */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={menuOpen}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            {menuOpen ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>

        <span className="text-lg font-semibold tracking-tight text-gray-900">
          Beauty<span className="text-blue-600">Book</span>
        </span>
      </div>

      <div ref={profileRef} className="relative">
        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 md:pr-3"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            {initial}
          </span>
          <span className="hidden max-w-[160px] truncate text-sm font-medium text-gray-700 md:block">
            {user.name}
          </span>
          <svg className="hidden h-4 w-4 text-gray-400 md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {profileOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
          >
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setProfileOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H4m0 0l3-3m-3 3l3 3M10 4h8a2 2 0 012 2v12a2 2 0 01-2 2h-8" />
              </svg>
              Выйти
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
