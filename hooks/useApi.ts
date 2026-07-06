// path: hooks/useApi.ts
// Базовый fetch wrapper + hook для мутаций (POST/PUT/DELETE).
// JWT живёт в httpOnly cookie — браузер шлёт его сам (credentials: same-origin),
// в JS токен не попадает (защита от XSS).

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/** Ошибка API с HTTP-статусом и деталями Zod-валидации (400) */
export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Низкоуровневый запрос к API. Бросает ApiRequestError.
 * Используй напрямую вне React-компонентов или внутри hooks.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: options.method ?? 'GET',
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: 'same-origin',
      signal: options.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    // сеть недоступна / offline
    throw new ApiRequestError(0, 'No connection. Check your internet and try again.');
  }

  // валидируем, что ответ — JSON (защита от HTML error pages)
  let json: unknown = null;
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      json = await res.json();
    } catch {
      throw new ApiRequestError(res.status, 'Server returned an invalid response');
    }
  }

  if (!res.ok) {
    const errBody = json as { error?: string; details?: Record<string, string[]> } | null;
    const message =
      errBody?.error ??
      (res.status >= 500 ? 'Something went wrong. Try again later.' : `Request error (${res.status})`);
    throw new ApiRequestError(res.status, message, errBody?.details);
  }

  return json as T;
}

interface UseApiResult<T> {
  /** Выполнить запрос. Возвращает данные или null при ошибке (ошибка — в error). */
  request: (path: string, options?: ApiFetchOptions) => Promise<T | null>;
  loading: boolean;
  error: string | null;
  /** детали Zod-валидации по полям (при 400) */
  fieldErrors: Record<string, string[]> | null;
  clearError: () => void;
}

/**
 * Hook для мутаций с loading/error state.
 * 401 → редирект на /login (сессия истекла).
 */
export function useApi<T = unknown>(): UseApiResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const router = useRouter();

  const request = useCallback(
    async (path: string, options: ApiFetchOptions = {}): Promise<T | null> => {
      setLoading(true);
      setError(null);
      setFieldErrors(null);
      try {
        return await apiFetch<T>(path, options);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return null;
        if (e instanceof ApiRequestError) {
          if (e.status === 401) {
            router.replace('/login');
            return null;
          }
          setError(e.message);
          setFieldErrors(e.details ?? null);
        } else {
          setError('Something went wrong');
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const clearError = useCallback(() => {
    setError(null);
    setFieldErrors(null);
  }, []);

  return { request, loading, error, fieldErrors, clearError };
}
