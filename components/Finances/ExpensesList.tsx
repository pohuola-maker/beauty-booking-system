// path: components/Finances/ExpensesList.tsx
// История расходов: таблица (desktop) / компактный список (mobile),
// delete с двухшаговым подтверждением

'use client';

import { useState } from 'react';
import Card from '@/components/Common/Card';
import { useApi } from '@/hooks/useApi';

export interface Expense {
  id: string;
  amount: string | number;
  description: string;
  date: string;
  expense_categories: { id: string; name: string } | null;
}

interface ExpensesListProps {
  expenses: Expense[];
  onDeleted: (message: string) => void;
  onError: (message: string) => void;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y.slice(2)}`;
}

export default function ExpensesList({ expenses, onDeleted, onError }: ExpensesListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { request, loading } = useApi<{ success: boolean }>();

  async function onDelete(id: string) {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    const result = await request(`/api/expenses/${id}`, { method: 'DELETE' });
    setConfirmId(null);
    if (result) onDeleted('Расход удалён');
    else onError('Не удалось удалить расход');
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-gray-500">Нет расходов за период</p>
      </Card>
    );
  }

  const deleteButton = (id: string) => (
    <button
      type="button"
      onClick={() => onDelete(id)}
      disabled={loading}
      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
        confirmId === id
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'text-red-600 hover:bg-red-50'
      }`}
    >
      {confirmId === id ? 'Точно?' : 'Удалить'}
    </button>
  );

  return (
    <Card noPadding>
      {/* desktop */}
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 font-medium">Дата</th>
            <th className="px-4 py-3 font-medium">Категория</th>
            <th className="px-4 py-3 font-medium">Описание</th>
            <th className="px-4 py-3 text-right font-medium">Сумма</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {expenses.map((e) => (
            <tr key={e.id} className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-700">{formatDate(e.date)}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                  {e.expense_categories?.name ?? '—'}
                </span>
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-gray-900">{e.description}</td>
              <td className="px-4 py-3 text-right font-medium text-red-600">
                −€{Number(e.amount).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right">{deleteButton(e.id)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* mobile */}
      <ul className="divide-y divide-gray-100 md:hidden">
        {expenses.map((e) => (
          <li key={e.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{e.description}</p>
              <p className="text-xs text-gray-500">
                {formatDate(e.date)} · {e.expense_categories?.name ?? '—'}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-red-600">
              −€{Number(e.amount).toFixed(2)}
            </span>
            {deleteButton(e.id)}
          </li>
        ))}
      </ul>
    </Card>
  );
}
