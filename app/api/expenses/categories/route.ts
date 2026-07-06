// path: app/api/expenses/categories/route.ts
// GET  /api/expenses/categories — категории расходов админа
// POST /api/expenses/categories — добавить категорию

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, throwDbError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { categoryCreateSchema } from '@/lib/validation';

export async function GET() {
  try {
    const auth = await requireAdmin();

    const { data, error } = await db()
      .from('expense_categories')
      .select('id, name, created_at')
      .eq('user_id', auth.id)
      .order('name');

    if (error) throwDbError(error);

    return NextResponse.json({ categories: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    const body = categoryCreateSchema.parse(await req.json());

    const { data: category, error } = await db()
      .from('expense_categories')
      .insert({ name: body.name, user_id: auth.id })
      .select('*')
      .single();

    if (error || !category) throwDbError(error ?? {}); // 23505 → категория уже есть

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
