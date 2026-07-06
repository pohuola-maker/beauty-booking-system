// path: hooks/useAuth.ts
// Текущий юзер из /api/auth/me + logout.
// AdminLayout сам решает, куда редиректить (guard по роли),
// но можно включить авто-редирект опцией { redirectTo: '/login' }.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiRequestError } from './useApi';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'client';
  name: string;
  phone: string | null;
  verified: boolean;
  created_at: string;
}

interface UseAuthOptions {
  /** если задан — редирект туда, когда юзер не залогинен */
  redirectTo?: string;
}

interface UseAuthResult {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  /** перезагрузить юзера (после изменения профиля) */
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(options: UseAuthOptions = {}): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { redirectTo } = options;

  const fetchUser = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: AuthUser }>('/api/auth/me');
      setUser(data.user);
      setError(null);
    } catch (e) {
      setUser(null);
      if (e instanceof ApiRequestError && e.status === 401) {
        // не залогинен — это не "ошибка", просто нет сессии
        setError(null);
      } else {
        setError(e instanceof Error ? e.message : 'Не удалось загрузить профиль');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  // опциональный авто-редирект для страниц без собственного guard
  useEffect(() => {
    if (redirectTo && !loading && !user) {
      router.replace(redirectTo);
    }
  }, [redirectTo, loading, user, router]);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout');
    } catch {
      // cookie мог уже истечь — всё равно уходим на login
    }
    setUser(null);
    router.replace('/login');
  }, [router]);

  return { user, loading, error, refetch: fetchUser, logout };
}
