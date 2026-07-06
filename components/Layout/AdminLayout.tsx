// path: components/Layout/AdminLayout.tsx
// Каркас всех админ-страниц:
//  - mobile:  TopBar + hamburger drawer + BottomNav
//  - desktop: TopBar + фиксированный sidebar слева
// Требует hooks/useAuth (BLOCK 3): редиректит на /login, если нет admin-сессии.

'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/Navigation/TopBar';
import SidebarNav from '@/components/Navigation/SidebarNav';
import BottomNav from '@/components/Navigation/BottomNav';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // guard: только залогиненный админ
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // блокируем прокрутку body, пока открыт drawer
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  if (loading || !user || user.role !== 'admin') {
    // skeleton каркаса, пока проверяем сессию
    return (
      <div className="min-h-screen bg-gray-50" aria-busy="true">
        <div className="h-14 border-b border-gray-200 bg-white" />
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-32 rounded-xl bg-gray-200" />
          <div className="h-32 rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar
        user={user}
        menuOpen={drawerOpen}
        onMenuClick={() => setDrawerOpen((v) => !v)}
        onLogout={logout}
      />

      {/* desktop sidebar */}
      <aside className="fixed bottom-0 left-0 top-14 z-40 hidden w-60 border-r border-gray-200 bg-white md:block">
        <SidebarNav />
      </aside>

      {/* mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-gray-900/40"
          />
          <div className="absolute bottom-0 left-0 top-14 w-64 overflow-y-auto bg-white shadow-xl">
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* контент: отступ под TopBar, sidebar (desktop) и BottomNav (mobile) */}
      <main className="pb-24 pt-14 md:pb-8 md:pl-60">
        <div className="mx-auto w-full max-w-6xl p-4 md:p-6">{children}</div>
      </main>

      <BottomNav />
    </div>
  );
}
