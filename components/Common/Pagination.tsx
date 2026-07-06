// path: components/Common/Pagination.tsx
// Prev/Next + "Страница X из Y" + jump-to-page input (desktop)

'use client';

import { useState, useEffect, type FormEvent } from 'react';

export interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, limit, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const [jumpValue, setJumpValue] = useState(String(page));

  useEffect(() => setJumpValue(String(page)), [page]);

  if (total <= limit) return null; // одна страница — пагинация не нужна

  function goTo(p: number) {
    const clamped = Math.min(Math.max(1, p), totalPages);
    if (clamped !== page) onPageChange(clamped);
  }

  function onJumpSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = parseInt(jumpValue, 10);
    if (!Number.isNaN(parsed)) goTo(parsed);
  }

  const navButton =
    'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 ' +
    'transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600';

  return (
    <nav aria-label="Пагинация" className="flex items-center justify-between gap-3 py-3">
      <button type="button" onClick={() => goTo(page - 1)} disabled={page <= 1} className={navButton}>
        ← Назад
      </button>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>
          Страница {page} из {totalPages}
        </span>
        {/* jump to page — только desktop */}
        <form onSubmit={onJumpSubmit} className="hidden items-center gap-1 sm:flex">
          <label htmlFor="page-jump" className="sr-only">
            Перейти на страницу
          </label>
          <input
            id="page-jump"
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-sm
              focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </form>
      </div>

      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className={navButton}
      >
        Вперёд →
      </button>
    </nav>
  );
}
