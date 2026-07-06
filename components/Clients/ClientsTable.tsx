// path: components/Clients/ClientsTable.tsx
// Таблица клиентов: сортировка по заголовкам (desktop), карточки (mobile)

'use client';

import { useState, useMemo } from 'react';
import Card from '@/components/Common/Card';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  tags: string[];
  notes: string | null;
  total_visits: number;
  total_spent: string | number;
  first_visit_date: string | null;
  last_visit_date: string | null;
  created_at: string;
}

type SortField = 'name' | 'total_visits' | 'total_spent' | 'last_visit_date';
type SortDir = 'asc' | 'desc';

interface ClientsTableProps {
  clients: Client[];
  onView: (client: Client) => void;
}

const columns: Array<{ field: SortField; label: string; align?: 'right' }> = [
  { field: 'name', label: 'Имя' },
  { field: 'total_visits', label: 'Визитов', align: 'right' },
  { field: 'total_spent', label: 'Потрачено', align: 'right' },
  { field: 'last_visit_date', label: 'Последний визит' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export default function ClientsTable({ clients, onView }: ClientsTableProps) {
  const [sortField, setSortField] = useState<SortField>('last_visit_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const copy = [...clients];
    copy.sort((a, b) => {
      let cmp: number;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'ru');
          break;
        case 'total_visits':
          cmp = a.total_visits - b.total_visits;
          break;
        case 'total_spent':
          cmp = Number(a.total_spent) - Number(b.total_spent);
          break;
        case 'last_visit_date':
          cmp = (a.last_visit_date ?? '').localeCompare(b.last_visit_date ?? '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [clients, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
  }

  if (clients.length === 0) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-gray-500">Клиенты не найдены</p>
      </Card>
    );
  }

  return (
    <>
      {/* desktop: таблица */}
      <Card noPadding className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              {columns.map((col) => (
                <th
                  key={col.field}
                  aria-sort={
                    sortField === col.field
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                  className={`px-4 py-3 font-medium ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(col.field)}
                    className="inline-flex items-center gap-1 hover:text-gray-900"
                  >
                    {col.label}
                    {sortField === col.field && (
                      <span aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Телефон</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  {c.tags.length > 0 && (
                    <p className="mt-0.5 flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                        >
                          {t}
                        </span>
                      ))}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">{c.total_visits}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  €{Number(c.total_spent).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-gray-700">{formatDate(c.last_visit_date)}</td>
                <td className="px-4 py-3">
                  <a href={`tel:${c.phone}`} className="text-blue-600 hover:text-blue-700">
                    {c.phone}
                  </a>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onView(c)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium
                      text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    Открыть
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* mobile: карточки */}
      <ul className="space-y-2 md:hidden">
        {sorted.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onView(c)}
              className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white
                p-3 text-left shadow-sm transition-colors active:bg-gray-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                {c.name.trim().charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-gray-900">{c.name}</span>
                <span className="block text-xs text-gray-500">
                  {c.total_visits} виз. · последний {formatDate(c.last_visit_date)}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-gray-900">
                €{Number(c.total_spent).toFixed(0)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
