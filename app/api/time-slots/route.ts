// path: app/api/time-slots/route.ts
// GET  /api/time-slots — слоты админа за период (фильтры from/to/available)
// POST /api/time-slots — создать слот(ы): один объект или { slots: [...] }

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, throwDbError, paginate } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { timeSlotsCreateSchema, timeSlotsQuerySchema, queryToObject } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    const q = timeSlotsQuerySchema.parse(queryToObject(req.nextUrl.searchParams));

    let query = db()
      .from('time_slots')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.id)
      .order('date')
      .order('start_time');

    if (q.from) query = query.gte('date', q.from);
    if (q.to) query = query.lte('date', q.to);
    if (q.available) query = query.eq('available', q.available === 'true');

    const { from, to } = paginate(q.page, q.limit);
    const { data, count, error } = await query.range(from, to);
    if (error) throwDbError(error);

    return NextResponse.json({
      time_slots: data ?? [],
      pagination: { page: q.page, limit: q.limit, total: count ?? 0 },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    const body = timeSlotsCreateSchema.parse(await req.json());

    const slots = 'slots' in body ? body.slots : [body];
    const rows = slots.map((s) => ({ ...s, user_id: auth.id, available: true }));

    // upsert + ignoreDuplicates: повторная генерация не падает на существующих слотах
    const { data, error } = await db()
      .from('time_slots')
      .upsert(rows, { onConflict: 'user_id,date,start_time', ignoreDuplicates: true })
      .select('*');
    if (error) throwDbError(error);

    await logAudit({
      userId: auth.id,
      action: 'create_time_slot',
      entityType: 'time_slot',
      newValue: { count: data?.length ?? 0, slots },
      req,
    });

    return NextResponse.json(
      { time_slots: data ?? [], created: data?.length ?? 0, requested: rows.length },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
