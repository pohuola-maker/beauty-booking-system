// path: app/api/finances/report/route.ts
// GET /api/finances/report?from=...&to=...&format=json|csv
// Детальный финансовый отчёт: доходы (по услугам) + расходы (по категориям).
// format=csv — единый журнал operations для бухгалтера / Revenue.ie.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, throwDbError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { financeReportQuerySchema, queryToObject } from '@/lib/validation';
import { logAudit } from '@/lib/audit';
import { toCsv, csvResponse } from '@/lib/csv';

interface IncomeRow {
  id: string;
  client_name: string;
  amount_received: string | number | null;
  services: { name: string } | null;
  time_slots: { date: string; start_time: string } | null;
}

interface ExpenseRow {
  id: string;
  amount: string | number;
  description: string;
  date: string;
  expense_categories: { name: string } | null;
}

interface LedgerRow {
  type: 'income' | 'expense';
  date: string;
  description: string;
  category: string;
  client: string;
  amount: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function sumBy(rows: LedgerRow[], key: (r: LedgerRow) => string): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const r of rows) {
    acc[key(r)] = round2((acc[key(r)] ?? 0) + r.amount);
  }
  return acc;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    const q = financeReportQuerySchema.parse(queryToObject(req.nextUrl.searchParams));

    const today = new Date().toISOString().slice(0, 10);
    const from = q.from ?? `${today.slice(0, 8)}01`; // default: текущий месяц
    const to = q.to ?? today;

    // доходы: confirmed букинги без no_show в диапазоне дат слота
    const { data: incomeData, error: incomeError } = await db()
      .from('bookings')
      .select(
        `id, client_name, amount_received,
         services ( name ),
         time_slots!inner ( date, start_time )`
      )
      .eq('user_id', auth.id)
      .eq('status', 'confirmed')
      .eq('no_show', false)
      .gte('time_slots.date', from)
      .lte('time_slots.date', to)
      .limit(10000);

    if (incomeError) throwDbError(incomeError);

    // расходы в диапазоне
    const { data: expenseData, error: expenseError } = await db()
      .from('expenses')
      .select('id, amount, description, date, expense_categories ( name )')
      .eq('user_id', auth.id)
      .gte('date', from)
      .lte('date', to)
      .limit(10000);

    if (expenseError) throwDbError(expenseError);

    const incomeRows = (incomeData ?? []) as unknown as IncomeRow[];
    const expenseRows = (expenseData ?? []) as unknown as ExpenseRow[];

    const ledger: LedgerRow[] = [
      ...incomeRows.map<LedgerRow>((r) => ({
        type: 'income',
        date: r.time_slots?.date ?? '',
        description: r.services?.name ?? 'Service',
        category: r.services?.name ?? 'Service',
        client: r.client_name,
        amount: Number(r.amount_received ?? 0),
      })),
      ...expenseRows.map<LedgerRow>((r) => ({
        type: 'expense',
        date: r.date,
        description: r.description,
        category: r.expense_categories?.name ?? 'other',
        client: '',
        amount: Number(r.amount),
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    const totalIncome = round2(
      ledger.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
    );
    const totalExpenses = round2(
      ledger.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
    );

    if (q.format === 'csv') {
      const csv = toCsv(ledger, [
        { header: 'Type', value: (r) => r.type },
        { header: 'Date', value: (r) => r.date },
        { header: 'Description', value: (r) => r.description },
        { header: 'Category / Service', value: (r) => r.category },
        { header: 'Client', value: (r) => r.client },
        {
          header: 'Amount (EUR)',
          value: (r) => (r.type === 'expense' ? -r.amount : r.amount).toFixed(2),
        },
      ]);

      await logAudit({
        userId: auth.id,
        action: 'export_report',
        entityType: 'expense',
        newValue: { type: 'finance_report_csv', from, to, rows: ledger.length },
        req,
      });

      return csvResponse(csv, `finance_report_${from}_${to}.csv`);
    }

    return NextResponse.json({
      period: { from, to },
      summary: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        profit: round2(totalIncome - totalExpenses),
        income_operations: incomeRows.length,
        expense_operations: expenseRows.length,
      },
      income_by_service: sumBy(
        ledger.filter((r) => r.type === 'income'),
        (r) => r.category
      ),
      expenses_by_category: sumBy(
        ledger.filter((r) => r.type === 'expense'),
        (r) => r.category
      ),
      ledger,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
