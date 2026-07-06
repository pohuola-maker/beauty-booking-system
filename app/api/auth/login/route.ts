// path: app/api/auth/login/route.ts
// POST /api/auth/login — email + password → JWT в httpOnly cookie

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, ApiError } from '@/lib/api';
import { verifyPassword, signToken, setAuthCookie, sanitizeUser } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = loginSchema.parse(await req.json());

    const { data: user, error } = await db()
      .from('users')
      .select('*')
      .eq('email', body.email)
      .maybeSingle();

    if (error) throw new ApiError(500, 'Database error');

    // одинаковое сообщение для "нет юзера" и "неверный пароль" —
    // не раскрываем, какие email зарегистрированы
    if (!user || !(await verifyPassword(body.password, user.password_hash))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    setAuthCookie(token);

    await logAudit({
      userId: user.id,
      action: 'login',
      entityType: 'user',
      entityId: user.id,
      req,
    });

    return NextResponse.json({ user: sanitizeUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}
