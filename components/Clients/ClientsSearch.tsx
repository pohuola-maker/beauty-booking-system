// path: components/Clients/ClientsSearch.tsx
// Живой поиск по имени/телефону/email с debounce 300ms + счётчик результатов

'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/Common/Input';

interface ClientsSearchProps {
  onSearch: (value: string) => void;
  /** total из pagination — для строки "N найдено" */
  resultCount: number | null;
}

export default function ClientsSearch({ onSearch, resultCount }: ClientsSearchProps) {
  const [value, setValue] = useState('');

  // debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => onSearch(value.trim()), 300);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div className="w-full sm:max-w-xs">
      <Input
        type="search"
        placeholder="Search: name, phone, email…"
        aria-label="Search clients"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        prefixIcon={
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
          </svg>
        }
      />
      {resultCount !== null && value.trim() && (
        <p className="mt-1 text-xs text-gray-500" aria-live="polite">
          Found: {resultCount}
        </p>
      )}
    </div>
  );
}
