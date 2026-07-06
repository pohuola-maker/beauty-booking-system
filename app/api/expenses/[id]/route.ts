// path: app/api/expenses/[id]/route.ts
// GET / PUT / DELETE расхода (админ, только свои)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, ApiError, throwDbError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { expenseUpdateSchema, uuidSchema } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

interface Params {
  params: { id: string };
}

async function getOwnExpense(userId: string, id: string) {
  const { data, error } = await db()
    .from('expenses')
    .select('*, expense_categories ( id, name )')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throwDbError(error);
  if (!data) throw new ApiError(404, 'Expense not found');
  return data;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin();
    const id = uuidSchema.parse(params.id);
    const expense = await getOwnExpense(auth.id, id);
    return NextResponse.json({ expense });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin();
    const id = uuidSchema.parse(params.id);
    const body = expenseUpdateSchema.parse(await req.json());

    const oldExpense = await getOwnExpense(auth.id, id);

    if (body.category_id) {
      const { data: category, error: catError } = await db()
        .from('expense_categories')
        .select('id')
        .eq('id', body.category_id)
        .eq('user_id', auth.id)
        .maybeSingle();
      if (catError) throwDbError(catError);
      if (!category) throw new ApiError(404, 'Expense category not found');
    }

    const { data: expense, error } = await db()
      .from('expenses')
      .update(body)
      .eq('id', id)
      .eq('user_id', auth.id)
      .select('*, expense_categories ( id, name )')
      .single();

    if (error || !expense) throwDbError(error ?? {});

    await logAudit({
      userId: auth.id,
      action: 'update_expense',
      entityType: 'expense',
      entityId: id,
      oldValue: oldExpense,
      newValue: expense,
      req,
    });

    return NextResponse.json({ expense });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin();
    const id = uuidSchema.parse(params.id);

    const expense = await getOwnExpense(auth.id, id);

    const { error } = await db().from('expenses').delete().eq('id', id).eq('user_id', auth.id);
    if (error) throwDbError(error);

    await logAudit({
      userId: auth.id,
      action: 'delete_expense',
      entityType: 'expense',
      entityId: id,
      oldValue: expense,
      req,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
