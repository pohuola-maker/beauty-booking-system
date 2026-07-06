// path: app/api/auth/change-password/route.ts
// PUT /api/auth/change-password — смена пароля (проверяет старый пароль)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, ApiError, throwDbError } from '@/lib/api';
import { requireAuth, verifyPassword, hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { changePasswordSchema } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = changePasswordSchema.parse(await req.json());

    const { data: user, error } = await db()
      .from('users')
      .select('id, password_hash, token_version')
      .eq('id', auth.id)
      .maybeSingle();

    if (error) throwDbError(error);
    if (!user) throw new ApiError(401, 'User no longer exists');

    if (!(await verifyPassword(body.old_password, user.password_hash))) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    const newHash = await hashPassword(body.new_password);
    const newVersion = (user.token_version ?? 0) + 1;

    const { error: updateError } = await db()
      .from('users')
      .update({ password_hash: newHash, token_version: newVersion })
      .eq('id', auth.id);

    if (updateError) throwDbError(updateError);

    // все старые сессии инвалидированы; текущей выдаём свежий токен
    const token = await signToken(
      { id: auth.id, email: auth.email, role: auth.role, name: auth.name },
      newVersion
    );
    setAuthCookie(token);

    // пароли в audit не пишем — только факт смены
    await logAudit({
      userId: auth.id,
      action: 'change_password',
      entityType: 'user',
      entityId: auth.id,
      req,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
