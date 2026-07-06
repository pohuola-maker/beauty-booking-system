// path: app/api/clients/[id]/route.ts
// GET / PUT / DELETE клиента (админ, только свои).
// DELETE — GDPR soft delete (deleted_at), история букингов сохраняется для налоговой.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, ApiError, throwDbError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { clientUpdateSchema, uuidSchema } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

interface Params {
  params: { id: string };
}

async function getOwnClient(userId: string, id: string) {
  const { data, error } = await db()
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throwDbError(error);
  if (!data) throw new ApiError(404, 'Client not found');
  return data;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin();
    const id = uuidSchema.parse(params.id);
    const client = await getOwnClient(auth.id, id);

    // история визитов клиента
    const { data: bookings, error } = await db()
      .from('bookings')
      .select(
        'id, status, amount_received, no_show, notes, services ( name ), time_slots ( date, start_time )'
      )
      .eq('client_id', id)
      .eq('user_id', auth.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throwDbError(error);

    return NextResponse.json({ client, bookings: bookings ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin();
    const id = uuidSchema.parse(params.id);
    const body = clientUpdateSchema.parse(await req.json());

    const oldClient = await getOwnClient(auth.id, id);

    const { data: client, error } = await db()
      .from('clients')
      .update(body)
      .eq('id', id)
      .eq('user_id', auth.id)
      .select('*')
      .single();

    if (error || !client) throwDbError(error ?? {});

    await logAudit({
      userId: auth.id,
      action: 'update_client',
      entityType: 'client',
      entityId: id,
      oldValue: oldClient,
      newValue: client,
      req,
    });

    return NextResponse.json({ client });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin();
    const id = uuidSchema.parse(params.id);

    const client = await getOwnClient(auth.id, id);

    const { error } = await db()
      .from('clients')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', auth.id);

    if (error) throwDbError(error);

    await logAudit({
      userId: auth.id,
      action: 'delete_client',
      entityType: 'client',
      entityId: id,
      oldValue: client,
      newValue: { soft_deleted: true },
      req,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
