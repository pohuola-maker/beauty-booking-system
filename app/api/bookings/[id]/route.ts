// path: app/api/bookings/[id]/route.ts
// GET / PUT / DELETE букинга (админ, только свои).
// PUT: смена статуса (pending→confirmed/cancelled), notes, amount_received, no_show.
// Освобождение/занятие слота при смене статуса делают триггеры БД.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, ApiError, throwDbError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { bookingUpdateSchema, uuidSchema } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

interface Params {
  params: { id: string };
}

async function getOwnBooking(userId: string, id: string) {
  const { data, error } = await db()
    .from('bookings')
    .select('*, services ( id, name, price ), time_slots ( id, date, start_time )')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throwDbError(error);
  if (!data) throw new ApiError(404, 'Booking not found');
  return data;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin();
    const id = uuidSchema.parse(params.id);
    const booking = await getOwnBooking(auth.id, id);
    return NextResponse.json({ booking });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin();
    const id = uuidSchema.parse(params.id);
    const body = bookingUpdateSchema.parse(await req.json());

    const oldBooking = await getOwnBooking(auth.id, id);

    const { data: booking, error } = await db()
      .from('bookings')
      .update(body)
      .eq('id', id)
      .eq('user_id', auth.id)
      .select('*, services ( id, name, price ), time_slots ( id, date, start_time )')
      .single();

    if (error || !booking) throwDbError(error ?? {}); // P0001 → слот уже занят при реактивации

    await logAudit({
      userId: auth.id,
      action: 'update_booking',
      entityType: 'booking',
      entityId: id,
      oldValue: oldBooking,
      newValue: booking,
      req,
    });

    return NextResponse.json({ booking });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin();
    const id = uuidSchema.parse(params.id);

    const booking = await getOwnBooking(auth.id, id);

    const { error } = await db().from('bookings').delete().eq('id', id).eq('user_id', auth.id);
    if (error) throwDbError(error);

    // триггер освобождает слот только при cancel — при физическом удалении делаем сами
    if (booking.status !== 'cancelled') {
      await db().from('time_slots').update({ available: true }).eq('id', booking.time_slot_id);
    }

    await logAudit({
      userId: auth.id,
      action: 'delete_booking',
      entityType: 'booking',
      entityId: id,
      oldValue: booking,
      req,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
