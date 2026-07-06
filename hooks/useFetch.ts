// path: hooks/useFetch.ts
// Общий hook для GET-списков (bookings, clients, expenses...).
// Фильтры и pagination передаются через params, refetch — вручную,
// автоматический перезапрос при изменении params.

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiRequestError } from './useApi';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

type ParamValue = string | number | boolean | undefined | null;

interface UseFetchOptions {
  /** query-параметры: undefined/null/'' не попадают в URL */
  params?: Record<string, ParamValue>;
  /** false — не запрашивать (например, пока не выбрана дата) */
  enabled?: boolean;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function buildUrl(path: string, params?: Record<string, ParamValue>): string {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

export function useFetch<T>(path: string, options: UseFetchOptions = {}): UseFetchResult<T> {
  const { params, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  // стабильный ключ, чтобы не перезапрашивать на каждый рендер
  const url = useMemo(() => buildUrl(path, params), [path, JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    // отменяем предыдущий незавершённый запрос (быстрая смена фильтров)
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<T>(url, { signal: controller.signal });
      setData(result);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return; // заменён новым запросом
      if (e instanceof ApiRequestError && e.status === 401) {
        router.replace('/login');
        return;
      }
      setError(e instanceof Error ? e.message : 'Не удалось загрузить данные');
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, [url, router]);

  useEffect(() => {
    if (!enabled) return;
    void load();
    return () => abortRef.current?.abort();
  }, [enabled, load]);

  return { data, loading, error, refetch: load };
}
