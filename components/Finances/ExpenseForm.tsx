// path: components/Finances/ExpenseForm.tsx
// Быстрое добавление расхода: категория (из БД), сумма, описание, дата

'use client';

import { useState, type FormEvent } from 'react';
import Card from '@/components/Common/Card';
import Input from '@/components/Common/Input';
import Select from '@/components/Common/Select';
import Button from '@/components/Common/Button';
import ErrorMessage from '@/components/Common/ErrorMessage';
import { useApi } from '@/hooks/useApi';
import { useFetch } from '@/hooks/useFetch';

interface Category {
  id: string;
  name: string;
}

interface ExpenseFormProps {
  onAdded: (message: string) => void;
}

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ExpenseForm({ onAdded }: ExpenseFormProps) {
  const categories = useFetch<{ categories: Category[] }>('/api/expenses/categories');
  const { request, loading, error, fieldErrors, clearError } = useApi<{ expense: unknown }>();

  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO);
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!categoryId) return setLocalError('Выбери категорию');
    if (!amount || Number(amount) <= 0) return setLocalError('Введи сумму больше 0');
    if (!description.trim()) return setLocalError('Введи описание');

    const result = await request('/api/expenses', {
      method: 'POST',
      body: {
        category_id: categoryId,
        amount: Number(amount),
        description: description.trim(),
        date,
      },
    });

    if (result) {
      // категорию и дату оставляем — удобно вбивать несколько расходов подряд
      setAmount('');
      setDescription('');
      onAdded('Расход добавлен');
    }
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Добавить расход</h2>

      <form onSubmit={onSubmit} noValidate className="space-y-3">
        {(localError || error) && <ErrorMessage message={localError ?? error ?? ''} />}

        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Категория"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder={categories.loading ? 'Загрузка…' : 'Выбери категорию'}
            options={(categories.data?.categories ?? []).map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            disabled={loading || categories.loading}
            error={fieldErrors?.category_id?.[0]}
          />

          <Input
            label="Сумма (€)"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="25.50"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            error={fieldErrors?.amount?.[0]}
          />
        </div>

        <Input
          label="Описание"
          type="text"
          placeholder="Клей для ресниц, 2 шт"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          error={fieldErrors?.description?.[0]}
        />

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              label="Дата"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={loading}
              error={fieldErrors?.date?.[0]}
            />
          </div>
          <Button type="submit" loading={loading}>
            Добавить
          </Button>
        </div>
      </form>
    </Card>
  );
}
