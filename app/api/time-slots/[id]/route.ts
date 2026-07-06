// path: app/api/time-slots/[id]/route.ts
// DELETE /api/time-slots/[id] — удалить слот (только если нет активного букинга)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, ApiError, throwDbError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { uuidSchema } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

interface Params {
  params: { id: string };
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin();
    const id = uuidSchema.parse(params.id);

    const { data: slot, error: slotError } = await db()
      .from('time_slots')
      .select('*')
      .eq('id', id)
      .eq('user_id', auth.id)
      .maybeSingle();

    if (slotError) throwDbError(slotError);
    if (!slot) throw new ApiError(404, 'Time slot not found');

    // CASCADE удалил бы и букинг — защищаемся
    const { count, error: countError } = await db()
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('time_slot_id', id)
      .neq('status', 'cancelled');

    if (countError) throwDbError(countError);
    if ((count ?? 0) > 0) {
      throw new ApiError(409, 'Time slot has an active booking — cancel it first');
    }

    const { error } = await db().from('time_slots').delete().eq('id', id).eq('user_id', auth.id);
    if (error) throwDbError(error);

    await logAudit({
      userId: auth.id,
      action: 'delete_time_slot',
      entityType: 'time_slot',
      entityId: id,
      oldValue: slot,
      req,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
