// path: app/api/expenses/route.ts
// GET  /api/expenses — расходы админа (фильтры category_id/from/to + pagination)
// POST /api/expenses — добавить расход

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, ApiError, throwDbError, paginate } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { expenseCreateSchema, expensesQuerySchema, queryToObject } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    const q = expensesQuerySchema.parse(queryToObject(req.nextUrl.searchParams));

    let query = db()
      .from('expenses')
      .select('*, expense_categories ( id, name )', { count: 'exact' })
      .eq('user_id', auth.id)
      .order('date', { ascending: false });

    if (q.category_id) query = query.eq('category_id', q.category_id);
    if (q.from) query = query.gte('date', q.from);
    if (q.to) query = query.lte('date', q.to);

    const { from, to } = paginate(q.page, q.limit);
    const { data, count, error } = await query.range(from, to);
    if (error) throwDbError(error);

    return NextResponse.json({
      expenses: data ?? [],
      pagination: { page: q.page, limit: q.limit, total: count ?? 0 },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    const body = expenseCreateSchema.parse(await req.json());

    // категория принадлежит этому админу?
    const { data: category, error: catError } = await db()
      .from('expense_categories')
      .select('id')
      .eq('id', body.category_id)
      .eq('user_id', auth.id)
      .maybeSingle();

    if (catError) throwDbError(catError);
    if (!category) throw new ApiError(404, 'Expense category not found');

    const { data: expense, error } = await db()
      .from('expenses')
      .insert({ ...body, user_id: auth.id })
      .select('*, expense_categories ( id, name )')
      .single();

    if (error || !expense) throwDbError(error ?? {});

    await logAudit({
      userId: auth.id,
      action: 'create_expense',
      entityType: 'expense',
      entityId: expense.id,
      newValue: expense,
      req,
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
