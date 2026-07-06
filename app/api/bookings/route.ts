// path: app/api/bookings/route.ts
// GET  /api/bookings — админ: свои букинги (фильтры status/from/to + pagination)
// POST /api/bookings — ПУБЛИЧНЫЙ: клиент записывается сам
//                      (double-booking блокируется exclusion constraint + trigger в БД)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, ApiError, throwDbError, paginate } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { bookingCreateSchema, bookingsQuerySchema, queryToObject } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    const q = bookingsQuerySchema.parse(queryToObject(req.nextUrl.searchParams));

    let query = db()
      .from('bookings')
      .select(
        `*,
         services ( id, name, price, duration_minutes ),
         time_slots!inner ( id, date, start_time, duration_minutes )`,
        { count: 'exact' }
      )
      .eq('user_id', auth.id)
      .order('created_at', { ascending: false });

    if (q.status) query = query.eq('status', q.status);
    if (q.from) query = query.gte('time_slots.date', q.from);
    if (q.to) query = query.lte('time_slots.date', q.to);

    const { from, to } = paginate(q.page, q.limit);
    const { data, count, error } = await query.range(from, to);
    if (error) throwDbError(error);

    return NextResponse.json({
      bookings: data ?? [],
      pagination: { page: q.page, limit: q.limit, total: count ?? 0 },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = bookingCreateSchema.parse(await req.json());

    // слот существует и свободен?
    const { data: slot, error: slotError } = await db()
      .from('time_slots')
      .select('*')
      .eq('id', body.time_slot_id)
      .maybeSingle();

    if (slotError) throwDbError(slotError);
    if (!slot) throw new ApiError(404, 'Time slot not found');
    if (!slot.available) throw new ApiError(409, 'Time slot is already booked');

    // услуга существует и принадлежит тому же мастеру?
    const { data: service, error: serviceError } = await db()
      .from('services')
      .select('*')
      .eq('id', body.service_id)
      .maybeSingle();

    if (serviceError) throwDbError(serviceError);
    if (!service) throw new ApiError(404, 'Service not found');
    if (service.user_id !== slot.user_id) {
      throw new ApiError(400, 'Service and time slot belong to different masters');
    }

    // CRM: find-or-create клиента по телефону
    const { data: existingClient, error: clientLookupError } = await db()
      .from('clients')
      .select('id')
      .eq('user_id', slot.user_id)
      .eq('phone', body.client_phone)
      .maybeSingle();

    if (clientLookupError) throwDbError(clientLookupError);

    let clientId = existingClient?.id as string | undefined;
    if (!clientId) {
      const { data: newClient, error: clientInsertError } = await db()
        .from('clients')
        .insert({
          user_id: slot.user_id,
          name: body.client_name,
          phone: body.client_phone,
          email: body.client_email ?? null,
          first_visit_date: slot.date,
          tags: ['new'],
        })
        .select('id')
        .single();

      if (clientInsertError || !newClient) throwDbError(clientInsertError ?? {});
      clientId = newClient.id;
    }

    const { data: booking, error: bookingError } = await db()
      .from('bookings')
      .insert({
        service_id: body.service_id,
        time_slot_id: body.time_slot_id,
        client_id: clientId,
        client_name: body.client_name,
        client_phone: body.client_phone,
        client_email: body.client_email ?? null,
        notes: body.notes ?? null,
        status: 'pending',
        user_id: slot.user_id,
      })
      .select('*, services ( name, price ), time_slots ( date, start_time )')
      .single();

    // 23P01 / P0001 → кто-то успел занять слот параллельно
    if (bookingError || !booking) throwDbError(bookingError ?? {});

    await logAudit({
      userId: slot.user_id, // актор — аноним; лог пишем на мастера
      action: 'create_booking',
      entityType: 'booking',
      entityId: booking.id,
      newValue: booking,
      req,
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
