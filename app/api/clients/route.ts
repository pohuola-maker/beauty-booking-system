// path: app/api/clients/route.ts
// GET  /api/clients — все клиенты админа (поиск, фильтр по tag / min_spent)
// POST /api/clients — админ добавляет клиента вручную

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, throwDbError, paginate } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { clientCreateSchema, clientsQuerySchema, queryToObject } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    const q = clientsQuerySchema.parse(queryToObject(req.nextUrl.searchParams));

    let query = db()
      .from('clients')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.id)
      .is('deleted_at', null) // GDPR: soft-deleted скрыты
      .order('updated_at', { ascending: false });

    if (q.search) {
      // убираем символы, ломающие PostgREST .or() синтаксис
      const s = q.search.replace(/[,()]/g, '');
      query = query.or(`name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
    }
    if (q.tag) query = query.contains('tags', [q.tag]);
    if (q.min_spent !== undefined) query = query.gte('total_spent', q.min_spent);

    const { from, to } = paginate(q.page, q.limit);
    const { data, count, error } = await query.range(from, to);
    if (error) throwDbError(error);

    return NextResponse.json({
      clients: data ?? [],
      pagination: { page: q.page, limit: q.limit, total: count ?? 0 },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    const body = clientCreateSchema.parse(await req.json());

    const { data: client, error } = await db()
      .from('clients')
      .insert({
        user_id: auth.id,
        name: body.name,
        phone: body.phone,
        email: body.email ?? null,
        tags: body.tags ?? [],
        notes: body.notes ?? null,
      })
      .select('*')
      .single();

    if (error || !client) throwDbError(error ?? {}); // 23505 → телефон уже есть

    await logAudit({
      userId: auth.id,
      action: 'create_client',
      entityType: 'client',
      entityId: client.id,
      newValue: client,
      req,
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
