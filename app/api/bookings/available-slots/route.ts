// path: app/api/bookings/available-slots/route.ts
// GET /api/bookings/available-slots?service_id=...&date=YYYY-MM-DD
// ПУБЛИЧНЫЙ: свободные слоты мастера на дату, подходящие по длительности услуги

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, ApiError, throwDbError } from '@/lib/api';
import { availableSlotsQuerySchema, queryToObject } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const q = availableSlotsQuerySchema.parse(queryToObject(req.nextUrl.searchParams));

    const { data: service, error: serviceError } = await db()
      .from('services')
      .select('id, user_id, duration_minutes, name, price')
      .eq('id', q.service_id)
      .maybeSingle();

    if (serviceError) throwDbError(serviceError);
    if (!service) throw new ApiError(404, 'Service not found');

    const { data: slots, error } = await db()
      .from('time_slots')
      .select('id, date, start_time, duration_minutes')
      .eq('user_id', service.user_id)
      .eq('date', q.date)
      .eq('available', true)
      .gte('duration_minutes', service.duration_minutes) // слот должен вмещать услугу
      .order('start_time');

    if (error) throwDbError(error);

    return NextResponse.json({
      service: { id: service.id, name: service.name, price: service.price },
      date: q.date,
      slots: slots ?? [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
