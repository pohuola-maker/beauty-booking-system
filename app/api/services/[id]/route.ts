// path: app/api/services/[id]/route.ts
// GET / PUT / DELETE одной услуги (админ, только свои)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, ApiError, throwDbError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { serviceUpdateSchema, uuidSchema } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

interface Params {
  params: { id: string };
}

async function getOwnService(userId: string, id: string) {
  const { data, error } = await db()
    .from('services')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throwDbError(error);
  if (!data) throw new ApiError(404, 'Service not found');
  return data;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin();
    const id = uuidSchema.parse(params.id);
    const service = await getOwnService(auth.id, id);
    return NextResponse.json({ service });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin();
    const id = uuidSchema.parse(params.id);
    const body = serviceUpdateSchema.parse(await req.json());

    const oldService = await getOwnService(auth.id, id);

    const { data: service, error } = await db()
      .from('services')
      .update(body)
      .eq('id', id)
      .eq('user_id', auth.id)
      .select('*')
      .single();

    if (error || !service) throwDbError(error ?? {});

    await logAudit({
      userId: auth.id,
      action: 'update_service',
      entityType: 'service',
      entityId: id,
      oldValue: oldService,
      newValue: service,
      req,
    });

    return NextResponse.json({ service });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin();
    const id = uuidSchema.parse(params.id);

    const service = await getOwnService(auth.id, id);

    // услугу с букингами удалять нельзя — это финансовая история (налоговая!)
    const { count, error: countError } = await db()
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('service_id', id);

    if (countError) throwDbError(countError);
    if ((count ?? 0) > 0) {
      throw new ApiError(
        409,
        'Cannot delete a service that has bookings (financial records must be kept)'
      );
    }

    const { error } = await db().from('services').delete().eq('id', id).eq('user_id', auth.id);
    if (error) throwDbError(error);

    await logAudit({
      userId: auth.id,
      action: 'delete_service',
      entityType: 'service',
      entityId: id,
      oldValue: service,
      req,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
