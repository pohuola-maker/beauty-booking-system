// path: components/Calendar/DatePicker.tsx
// Навигация по дате: стрелки < >, "Сегодня", по клику на дату — нативный date picker

'use client';

import { useRef } from 'react';
import { addDays, toISODate } from './types';

interface DatePickerProps {
  date: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

export default function DatePicker({ date, onChange }: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const today = toISODate(new Date());

  const arrowButton =
    'flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white ' +
    'text-gray-600 transition-colors hover:bg-gray-50 active:bg-gray-100 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600';

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(addDays(date, -1))}
        aria-label="Предыдущий день"
        className={arrowButton}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* дата: клик открывает нативный date picker (отлично работает на телефоне) */}
      <div className="relative min-w-0 flex-1 sm:flex-none">
        <button
          type="button"
          onClick={() => inputRef.current?.showPicker?.()}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-sm
            font-semibold capitalize text-gray-900 transition-colors hover:bg-gray-50 sm:w-48
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          {formatLabel(date)}
        </button>
        <input
          ref={inputRef}
          type="date"
          value={date}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          aria-label="Выбрать дату"
          tabIndex={-1}
          className="absolute inset-0 -z-10 opacity-0"
        />
      </div>

      <button
        type="button"
        onClick={() => onChange(addDays(date, 1))}
        aria-label="Следующий день"
        className={arrowButton}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {date !== today && (
        <button
          type="button"
          onClick={() => onChange(today)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-colors
            hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          Сегодня
        </button>
      )}
    </div>
  );
}

function formatLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
  }).format(new Date(y, m - 1, d));
}
