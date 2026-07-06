// path: app/api/auth/profile/route.ts
// PUT /api/auth/profile — обновление имени и телефона текущего юзера

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, throwDbError } from '@/lib/api';
import { requireAuth, sanitizeUser } from '@/lib/auth';
import { profileUpdateSchema } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = profileUpdateSchema.parse(await req.json());

    const { data: user, error } = await db()
      .from('users')
      .update({ name: body.name, phone: body.phone || null })
      .eq('id', auth.id)
      .select('id, email, role, phone, name, verified, user_metadata, created_at')
      .single();

    if (error || !user) throwDbError(error ?? {});

    await logAudit({
      userId: auth.id,
      action: 'update_profile',
      entityType: 'user',
      entityId: auth.id,
      newValue: { name: body.name, phone: body.phone || null },
      req,
    });

    return NextResponse.json({ user: sanitizeUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}
