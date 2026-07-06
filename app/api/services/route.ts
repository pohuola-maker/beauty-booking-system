// path: app/api/services/route.ts
// GET  /api/services — публичный список услуг (для страницы записи);
//                      админ получает свои услуги
// POST /api/services — админ создаёт услугу

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, throwDbError } from '@/lib/api';
import { requireAdmin, requireAuth, AuthUser } from '@/lib/auth';
import { serviceCreateSchema } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

async function optionalAuth(): Promise<AuthUser | null> {
  try {
    return await requireAuth();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const auth = await optionalAuth();

    let query = db()
      .from('services')
      .select('id, name, duration_minutes, price, description, photo_url, created_at')
      .order('name');

    // админ видит только свои; публика — все опубликованные услуги
    if (auth?.role === 'admin') {
      query = query.eq('user_id', auth.id);
    }

    const { data, error } = await query;
    if (error) throwDbError(error);

    return NextResponse.json({ services: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    const body = serviceCreateSchema.parse(await req.json());

    const { data: service, error } = await db()
      .from('services')
      .insert({ ...body, user_id: auth.id })
      .select('*')
      .single();

    if (error || !service) throwDbError(error ?? {});

    await logAudit({
      userId: auth.id,
      action: 'create_service',
      entityType: 'service',
      entityId: service.id,
      newValue: service,
      req,
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
