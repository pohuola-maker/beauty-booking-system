// path: app/(protected)/admin/finances/page.tsx
// Финансы: период → summary (доход/расход/прибыль/маржа),
// форма расхода, таблица расходов, CSV export отчёта

'use client';

import { useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import PeriodSelector, {
  type Period,
  periodRange,
} from '@/components/Finances/PeriodSelector';
import ExpenseForm from '@/components/Finances/ExpenseForm';
import ExpensesList, { type Expense } from '@/components/Finances/ExpensesList';
import Card from '@/components/Common/Card';
import Button from '@/components/Common/Button';
import ErrorMessage from '@/components/Common/ErrorMessage';
import Toast, { type ToastType } from '@/components/Common/Toast';
import { SkeletonCards, SkeletonRows } from '@/components/Common/Loading';
import { useFetch } from '@/hooks/useFetch';

interface ReportSummary {
  total_income: number;
  total_expenses: number;
  profit: number;
  income_operations: number;
  expense_operations: number;
}

export default function FinancesPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [exporting, setExporting] = useState(false);

  const { from, to } = periodRange(period);

  const report = useFetch<{ summary: ReportSummary }>('/api/finances/report', {
    params: { from, to },
  });
  const expenses = useFetch<{ expenses: Expense[] }>('/api/expenses', {
    params: { from, to, limit: 100 },
  });

  const summary = report.data?.summary;
  const margin =
    summary && summary.total_income > 0
      ? Math.round((summary.profit / summary.total_income) * 100)
      : 0;

  function refetchAll() {
    void report.refetch();
    void expenses.refetch();
  }

  function onExpenseAdded(message: string) {
    setToast({ message, type: 'success' });
    refetchAll();
  }

  function onExpenseDeleted(message: string) {
    setToast({ message, type: 'success' });
    refetchAll();
  }

  async function exportReport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/finances/report?from=${from}&to=${to}&format=csv`, {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance_report_${from}_${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: 'Отчёт скачан', type: 'success' });
    } catch {
      setToast({ message: 'Не удалось экспортировать отчёт', type: 'error' });
    } finally {
      setExporting(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Финансы</h1>
          <Button variant="secondary" size="sm" onClick={exportReport} loading={exporting}>
            Export report
          </Button>
        </div>

        <PeriodSelector value={period} onChange={setPeriod} />

        {/* summary */}
        {report.error ? (
          <ErrorMessage message={report.error} onRetry={report.refetch} />
        ) : report.loading || !summary ? (
          <SkeletonCards count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="border-l-4 border-l-green-500">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Доход</p>
              <p className="mt-1.5 text-2xl font-semibold text-green-600">
                €{summary.total_income.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-gray-500">{summary.income_operations} записей</p>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Расходы</p>
              <p className="mt-1.5 text-2xl font-semibold text-red-600">
                €{summary.total_expenses.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-gray-500">{summary.expense_operations} операций</p>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Прибыль</p>
              <p
                className={`mt-1.5 text-2xl font-semibold ${
                  summary.profit >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}
              >
                €{summary.profit.toFixed(2)}
              </p>
            </Card>

            <Card className="border-l-4 border-l-gray-400">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Profit margin
              </p>
              <p className="mt-1.5 text-2xl font-semibold text-gray-900">{margin}%</p>
            </Card>
          </div>
        )}

        <ExpenseForm onAdded={onExpenseAdded} />

        {/* расходы за период */}
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-900">Расходы за период</h2>
          {expenses.error ? (
            <ErrorMessage message={expenses.error} onRetry={expenses.refetch} />
          ) : expenses.loading || !expenses.data ? (
            <Card>
              <SkeletonRows rows={5} />
            </Card>
          ) : (
            <ExpensesList
              expenses={expenses.data.expenses}
              onDeleted={onExpenseDeleted}
              onError={(m) => setToast({ message: m, type: 'error' })}
            />
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
